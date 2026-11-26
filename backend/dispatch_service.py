"""
Auto-dispatch for delivery orders.

Rules (when AUTO_DISPATCH_ENABLED=true):
  * As soon as a delivery order is PLACED by the customer (the restaurant can still accept it and
    assign a rider by hand during the window; if it is rejected/cancelled, any Porter booking is
    cancelled automatically):
      - distance > DISPATCH_PORTER_KM (default 5 km)  -> book a Porter rider immediately.
      - otherwise -> offer the order to the active in-house riders for
        DISPATCH_RIDER_WINDOW_SECONDS (default 30 s). The first rider to tap
        "Accept" gets it. If nobody accepts in time, or every rider declines,
        a Porter rider is booked.
  * Porter is only booked automatically when Porter is LIVE (real API key,
    mock mode off). Otherwise the order is flagged dispatch_status="needs_manual"
    so the admin assigns it by hand - customers never see fake mock riders.

Timeout reliability on Cloud Run: an in-process timer fires after the window,
and every poll of the rider/admin order lists sweeps expired offers, and
POST /api/internal/dispatch/sweep (for Cloud Scheduler) does the same. All
state changes go through a Firestore transaction, so a rider accept and a
Porter booking can never both win.
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger("dispatch")


def _env_bool(name: str, default: str) -> bool:
    return os.environ.get(name, default).strip().lower() in ("1", "true", "yes", "on")


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def dispatch_enabled() -> bool:
    return _env_bool("AUTO_DISPATCH_ENABLED", "false")


def porter_threshold_km() -> float:
    return _env_float("DISPATCH_PORTER_KM", 5.0)


def rider_window_seconds() -> int:
    return int(_env_float("DISPATCH_RIDER_WINDOW_SECONDS", 30))


def porter_webhook_url() -> str:
    """Where Porter posts rider status updates (no request context in background dispatch)."""
    return os.environ.get(
        "PORTER_WEBHOOK_URL",
        "https://tasteofhindustan-api-63332283509.asia-south1.run.app/api/porter/webhook",
    )


def porter_auto_booking_allowed() -> bool:
    """Auto-book Porter only when Porter is live, or mock bookings were explicitly allowed (testing)."""
    from porter_service import is_porter_mock_enabled
    return (not is_porter_mock_enabled()) or _env_bool("DISPATCH_ALLOW_MOCK_PORTER", "false")


# Dispatch states stored on the order as `dispatch_status`
OFFERED = "offered"
RIDER_ASSIGNED = "rider_assigned"
PORTER_BOOKING = "porter_booking"
PORTER_BOOKED = "porter_booked"
NEEDS_MANUAL = "needs_manual"

DELIVERY_TYPES = ("DELIVERY", "online", "ONLINE")
_mock_lock = asyncio.Lock()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def is_delivery_order(order: Dict[str, Any]) -> bool:
    return (order.get("order_type") or "DELIVERY") in DELIVERY_TYPES


def has_rider(order: Dict[str, Any]) -> bool:
    return bool(order.get("delivery_partner_id") or order.get("porter_order_id"))


CLOSED_ORDER_STATUSES = ("rejected", "cancelled", "delivered")


def is_order_live(order: Dict[str, Any]) -> bool:
    return order.get("status") not in CLOSED_ORDER_STATUSES


def offer_is_open(order: Dict[str, Any], now: Optional[datetime] = None) -> bool:
    if order.get("dispatch_status") != OFFERED or has_rider(order) or not is_order_live(order):
        return False
    exp = _parse(order.get("dispatch_expires_at"))
    return bool(exp and (now or _now()) < exp)


def offer_is_expired(order: Dict[str, Any], now: Optional[datetime] = None) -> bool:
    if order.get("dispatch_status") != OFFERED or has_rider(order) or not is_order_live(order):
        return False
    exp = _parse(order.get("dispatch_expires_at"))
    return bool(exp and (now or _now()) >= exp)


# ── Atomic compare-and-set on an order ─────────────────────────────────────────

async def _claim(manager, order_id: str, check: Callable[[Dict[str, Any]], bool],
                 build_update: Callable[[Dict[str, Any]], Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Re-read the order, and only if check(order) is True apply build_update(order).
    Firestore: inside a transaction. Mock DB: under an in-process lock.
    Returns the merged order on success, None if the check failed.
    """
    db = getattr(manager, "db", None)
    if db is not None and hasattr(db, "transaction"):
        from google.cloud import firestore as gcf
        docs = list(db.collection("orders").where("order_id", "==", order_id).limit(1).stream())
        if not docs:
            return None
        ref = docs[0].reference

        @gcf.transactional
        def _txn(transaction):
            snap = ref.get(transaction=transaction)
            data = snap.to_dict() or {}
            if not check(data):
                return None
            update = build_update(data)
            update["updated_at"] = datetime.utcnow().isoformat()
            transaction.update(ref, update)
            return {**data, **update}

        return _txn(db.transaction())

    async with _mock_lock:
        order = await manager.get_order_by_id(order_id)
        if not order or not check(order):
            return None
        update = build_update(order)
        await manager.update_order(order_id, update)
        return {**order, **update}


def _history(order: Dict[str, Any], note: str) -> List[Dict[str, Any]]:
    history = list(order.get("status_history") or [])
    history.append({"status": order.get("status"), "timestamp": datetime.utcnow().isoformat(), "note": note})
    return history


# ── Riders ────────────────────────────────────────────────────────────────────

async def active_rider_ids(manager) -> List[str]:
    partners = await manager._read("delivery_partners")
    return [str(p.get("id") or p.get("_id")) for p in partners if p.get("active", True) and (p.get("id") or p.get("_id"))]


async def _add_to_rider_current_orders(manager, partner_id: str, order_id: str) -> None:
    try:
        partners = await manager._read("delivery_partners")
        for p in partners:
            if str(p.get("id") or p.get("_id")) == partner_id:
                current = list(p.get("current_orders") or [])
                if order_id not in current:
                    current.append(order_id)
                p["current_orders"] = current
                break
        await manager._write("delivery_partners", partners)
    except Exception as e:  # bookkeeping only
        logger.warning(f"[Dispatch] could not update rider current_orders: {e}")


# ── Entry point: order accepted ───────────────────────────────────────────────

async def start_dispatch(manager, order_id: str) -> Optional[str]:
    """Called right after a delivery order is PLACED (and again on accept as a fallback; it only
    ever runs once per order). Returns the resulting dispatch_status."""
    if not dispatch_enabled():
        return None
    order = await manager.get_order_by_id(order_id)
    if (not order or not is_delivery_order(order) or not is_order_live(order)
            or has_rider(order) or order.get("dispatch_status")):
        return None

    km = order.get("distance_km")
    try:
        km = float(km) if km is not None else None
    except (TypeError, ValueError):
        km = None

    if km is not None and km > porter_threshold_km():
        return await book_porter(manager, order_id, reason=f"distance {km:.1f} km > {porter_threshold_km():.0f} km")

    riders = await active_rider_ids(manager)
    if not riders:
        return await book_porter(manager, order_id, reason="no active in-house riders")

    window = rider_window_seconds()
    now = _now()
    claimed = await _claim(
        manager, order_id,
        check=lambda o: not has_rider(o) and not o.get("dispatch_status"),
        build_update=lambda o: {
            "dispatch_status": OFFERED,
            "dispatch_offered_at": now.isoformat(),
            "dispatch_expires_at": (now + timedelta(seconds=window)).isoformat(),
            "dispatch_offered_to": riders,
            "dispatch_declined_by": [],
            "status_history": _history(o, f"Offered to {len(riders)} in-house rider(s) for {window}s"),
        },
    )
    if not claimed:
        return None
    logger.info(f"[Dispatch] {order_id} offered to {len(riders)} rider(s) for {window}s")
    _schedule_timeout(manager, order_id, window)
    return OFFERED


def _schedule_timeout(manager, order_id: str, window: int) -> None:
    async def _later():
        try:
            await asyncio.sleep(window + 1)
            await expire_offer_if_due(manager, order_id)
        except Exception as e:
            logger.warning(f"[Dispatch] timeout task error for {order_id}: {e}")
    try:
        asyncio.get_running_loop().create_task(_later())
    except RuntimeError:
        pass  # no running loop (e.g. sync tests) — the sweeps still cover it


# ── Rider actions ─────────────────────────────────────────────────────────────

async def rider_accept(manager, order_id: str, partner: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    partner_id = str(partner.get("id") or partner.get("_id"))
    vehicle = f"{partner.get('vehicle_type', 'Bike')}" + (f" ({partner.get('vehicle_number')})" if partner.get("vehicle_number") else "")
    now = _now()

    claimed = await _claim(
        manager, order_id,
        check=lambda o: offer_is_open(o, now)
        and partner_id in [str(x) for x in (o.get("dispatch_offered_to") or [])]
        and partner_id not in [str(x) for x in (o.get("dispatch_declined_by") or [])],
        build_update=lambda o: {
            "dispatch_status": RIDER_ASSIGNED,
            "dispatch_resolved_at": now.isoformat(),
            "delivery_partner_id": partner_id,
            "delivery_partner_name": partner.get("name"),
            "delivery_partner_phone": partner.get("phone"),
            "delivery_partner_vehicle": vehicle,
            "delivery_fleet": "Persian Darbar Private Fleet",
            "status_history": _history(o, f"In-house rider {partner.get('name')} accepted the delivery"),
        },
    )
    if claimed:
        await _add_to_rider_current_orders(manager, partner_id, order_id)
        logger.info(f"[Dispatch] {order_id} accepted by rider {partner_id}")
    return claimed


async def rider_decline(manager, order_id: str, partner: Dict[str, Any]) -> bool:
    partner_id = str(partner.get("id") or partner.get("_id"))
    claimed = await _claim(
        manager, order_id,
        check=lambda o: offer_is_open(o) and partner_id in [str(x) for x in (o.get("dispatch_offered_to") or [])],
        build_update=lambda o: {
            "dispatch_declined_by": sorted(set([str(x) for x in (o.get("dispatch_declined_by") or [])] + [partner_id])),
        },
    )
    if not claimed:
        return False
    offered = {str(x) for x in (claimed.get("dispatch_offered_to") or [])}
    declined = {str(x) for x in (claimed.get("dispatch_declined_by") or [])}
    if offered and offered <= declined:
        await book_porter(manager, order_id, reason="all in-house riders declined", from_offer=True)
    return True


async def offers_for_rider(manager, partner: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Open offers this rider can still accept, newest first, with seconds left."""
    await sweep_expired(manager)
    partner_id = str(partner.get("id") or partner.get("_id"))
    now = _now()
    result = []
    for o in await _offered_orders(manager):
        if not offer_is_open(o, now):
            continue
        if partner_id not in [str(x) for x in (o.get("dispatch_offered_to") or [])]:
            continue
        if partner_id in [str(x) for x in (o.get("dispatch_declined_by") or [])]:
            continue
        exp = _parse(o.get("dispatch_expires_at"))
        result.append({
            "order_id": o.get("order_id"),
            "status": o.get("status"),
            "branch_name": o.get("branch_name"),
            "address": o.get("address"),
            "distance_km": o.get("distance_km"),
            "total": o.get("total"),
            "payment_method": o.get("payment_method"),
            "items_count": sum(int(i.get("quantity", 1) or 1) for i in (o.get("items") or [])),
            "expires_at": o.get("dispatch_expires_at"),
            "seconds_left": max(0, int((exp - now).total_seconds())) if exp else 0,
        })
    return sorted(result, key=lambda x: x.get("expires_at") or "", reverse=True)


# ── Timeout handling ──────────────────────────────────────────────────────────

async def _offered_orders(manager) -> List[Dict[str, Any]]:
    db = getattr(manager, "db", None)
    if db is not None and hasattr(db, "transaction"):
        return [d.to_dict() for d in db.collection("orders").where("dispatch_status", "==", OFFERED).stream()]
    return [o for o in await manager._read("orders") if o.get("dispatch_status") == OFFERED]


async def expire_offer_if_due(manager, order_id: str) -> Optional[str]:
    order = await manager.get_order_by_id(order_id)
    if order and offer_is_expired(order):
        return await book_porter(manager, order_id, reason=f"no in-house rider accepted within {rider_window_seconds()}s", from_offer=True)
    return None


async def sweep_expired(manager) -> int:
    """Resolve every offer whose window has passed. Safe to call from any request."""
    if not dispatch_enabled():
        return 0
    count = 0
    try:
        now = _now()
        for o in await _offered_orders(manager):
            if offer_is_expired(o, now):
                await book_porter(manager, o.get("order_id"), reason=f"no in-house rider accepted within {rider_window_seconds()}s", from_offer=True)
                count += 1
    except Exception as e:
        logger.warning(f"[Dispatch] sweep error: {e}")
    return count


# ── Order rejected / cancelled ────────────────────────────────────────────────

PORTER_PICKED_UP = ("order_picked_up", "started_for_delivery", "delivered")


async def release_on_cancel(manager, order_id: str, reason: str = "Order cancelled") -> Optional[str]:
    """
    Dispatch now starts at order placement, so Porter can already be booked when the restaurant
    rejects or the customer cancels. Close any open rider offer and cancel the Porter booking
    (unless the Porter rider has already picked the food up). Returns what was done, if anything.
    """
    order = await manager.get_order_by_id(order_id)
    if not order:
        return None

    if order.get("dispatch_status") == OFFERED and not has_rider(order):
        await manager.update_order(order_id, {"dispatch_status": "closed", "dispatch_reason": reason})
        return "offer_closed"

    porter_id = order.get("porter_order_id")
    if not porter_id:
        return None
    if order.get("porter_status") in PORTER_PICKED_UP:
        logger.warning(f"[Dispatch] {order_id} cancelled after Porter pickup - Porter booking left as is")
        return "porter_already_picked_up"

    try:
        from porter_service import cancel_porter_order
        res = await cancel_porter_order(porter_id, reason)
    except Exception as e:
        res = {"success": False, "error": str(e)}

    if res.get("success"):
        await manager.update_order(order_id, {
            "porter_order_id": None,
            "porter_status": "cancelled",
            "porter_tracking_url": None,
            "porter_rider_name": None,
            "porter_rider_phone": None,
            "dispatch_status": "closed",
            "dispatch_reason": f"{reason}; Porter booking {porter_id} cancelled",
            "status_history": _history(order, f"Porter booking {porter_id} cancelled automatically ({reason})"),
        })
        logger.info(f"[Dispatch] Porter {porter_id} cancelled for {order_id} ({reason})")
        return "porter_cancelled"

    await manager.update_order(order_id, {
        "dispatch_reason": f"{reason}; Porter cancel FAILED for {porter_id}: {res.get('error')} - cancel it in the Porter dashboard",
        "status_history": _history(order, f"Porter cancel failed ({res.get('error')}) - cancel {porter_id} manually"),
    })
    logger.warning(f"[Dispatch] Porter cancel failed for {order_id}: {res.get('error')}")
    return "porter_cancel_failed"


# ── Porter booking ────────────────────────────────────────────────────────────

async def book_porter(manager, order_id: str, reason: str, from_offer: bool = False) -> Optional[str]:
    """Claim the order for Porter (exactly once), then book. Falls back to needs_manual."""
    now = _now()

    def can_claim(o: Dict[str, Any]) -> bool:
        if has_rider(o) or not is_order_live(o):
            return False
        if from_offer:
            return o.get("dispatch_status") == OFFERED
        return not o.get("dispatch_status")

    if not porter_auto_booking_allowed():
        flagged = await _claim(
            manager, order_id, check=can_claim,
            build_update=lambda o: {
                "dispatch_status": NEEDS_MANUAL,
                "dispatch_reason": f"{reason}; Porter not live - assign a rider manually",
                "dispatch_resolved_at": now.isoformat(),
                "status_history": _history(o, f"Auto-dispatch: {reason}. Porter not live - manual assignment needed"),
            },
        )
        if flagged:
            logger.info(f"[Dispatch] {order_id} needs manual assignment ({reason}; Porter not live)")
        return NEEDS_MANUAL if flagged else None

    claimed = await _claim(
        manager, order_id, check=can_claim,
        build_update=lambda o: {"dispatch_status": PORTER_BOOKING, "dispatch_reason": reason},
    )
    if not claimed:
        return None

    try:
        lat = claimed.get("latitude") or claimed.get("drop_lat")
        lng = claimed.get("longitude") or claimed.get("drop_lng")
        if lat is None or lng is None:
            raise ValueError("order has no delivery coordinates")
        from porter_service import create_porter_order
        from branches import pickup_for_order
        pickup = pickup_for_order(claimed)
        if pickup is None:
            raise ValueError(f"unknown branch '{claimed.get('branch_id') or claimed.get('branch')}' - no pickup point")
        res = await create_porter_order(
            rms_order_id=order_id,
            customer_name=claimed.get("customer_name") or "Customer",
            customer_phone=claimed.get("phone") or "",
            drop_lat=float(lat),
            drop_lng=float(lng),
            drop_address=claimed.get("address") or "",
            amount=float(claimed.get("total") or 0.0),
            payment_method="cash" if claimed.get("payment_method") == "cod" else "prepaid",
            vehicle_type="2-wheeler",
            webhook_url=porter_webhook_url(),
            pickup=pickup,
        )
    except Exception as e:
        res = {"success": False, "error": str(e)}

    if res.get("success"):
        await manager.update_order(order_id, {
            "dispatch_status": PORTER_BOOKED,
            "dispatch_resolved_at": _now().isoformat(),
            "porter_order_id": res.get("porter_order_id", ""),
            "porter_status": res.get("status", "open"),
            "porter_tracking_url": res.get("tracking_url", ""),
            "porter_rider_name": res.get("rider_name", ""),
            "porter_rider_phone": res.get("rider_phone", ""),
            "porter_booked_at": _now().isoformat(),
            "delivery_fleet": "Porter Delivery Fleet",
            "status_history": _history(claimed, f"Porter booked automatically ({reason}) - ID {res.get('porter_order_id')}"),
        })
        logger.info(f"[Dispatch] Porter booked for {order_id}: {res.get('porter_order_id')} ({reason})")
        return PORTER_BOOKED

    await manager.update_order(order_id, {
        "dispatch_status": NEEDS_MANUAL,
        "dispatch_reason": f"{reason}; Porter booking failed: {res.get('error')}",
        "dispatch_resolved_at": _now().isoformat(),
        "status_history": _history(claimed, f"Porter auto-booking failed ({res.get('error')}) - assign a rider manually"),
    })
    logger.warning(f"[Dispatch] Porter booking failed for {order_id}: {res.get('error')}")
    return NEEDS_MANUAL
