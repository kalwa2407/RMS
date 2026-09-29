"""
Porter Delivery Service Integration
====================================
Handles all communication with the Porter API for on-demand intracity delivery.

Porter API Reference:
  Base URL (sandbox): https://pfe-apigw-uat.porter.in
  Base URL (prod):    https://pfe-apigw.porter.in

Endpoints used:
  POST /v1/get_quote          — Get ETA + cost estimate before booking
  POST /v1/orders/create      — Create/book a Porter delivery order
  GET  /v1/orders/{id}        — Get order status and rider details
  POST /v1/orders/{id}/cancel — Cancel a Porter booking

All requests require:
  Header: x-api-key: <PORTER_API_KEY>

Restaurant Pickup Coordinates (Persian Darbar, Pune):
  Lat: 18.519514, Lng: 73.874114
  Address: Wellesley Rd, Camp, Pune, Maharashtra 411001
"""

import os
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

# ── Configuration (read from environment) ──────────────────────────────────────

PORTER_API_KEY      = os.environ.get("PORTER_API_KEY", "")
PORTER_API_BASE     = os.environ.get("PORTER_API_BASE_URL", "https://pfe-apigw-uat.porter.in")
PORTER_WEBHOOK_SEC  = os.environ.get("PORTER_WEBHOOK_SECRET", "")

# Persian Darbar restaurant fixed pickup location
RESTAURANT_LAT      = float(os.environ.get("RESTAURANT_LAT", "18.519514"))
RESTAURANT_LNG      = float(os.environ.get("RESTAURANT_LNG", "73.874114"))
RESTAURANT_NAME     = os.environ.get("RESTAURANT_NAME", "Persian Darbar")
RESTAURANT_PHONE    = os.environ.get("RESTAURANT_PHONE", "+919594287868")
RESTAURANT_ADDRESS  = os.environ.get(
    "RESTAURANT_ADDRESS",
    "Wellesley Rd, Camp, Pune, Maharashtra 411001"
)


def _headers() -> dict:
    """Return standard Porter API request headers."""
    return {
        "x-api-key":    PORTER_API_KEY,
        "Content-Type": "application/json",
        "Accept":       "application/json",
    }


def is_porter_configured() -> bool:
    """Check whether Porter API key is set and non-empty."""
    return bool(PORTER_API_KEY and PORTER_API_KEY.strip())


# ── Quote ──────────────────────────────────────────────────────────────────────

async def get_porter_quote(
    drop_lat: float,
    drop_lng: float,
    drop_address: str = "",
    vehicle_type: str = "2-wheeler"
) -> dict:
    """
    Get a Porter delivery quote (ETA + fare estimate) before booking.

    Args:
        drop_lat:     Dropoff latitude (customer location)
        drop_lng:     Dropoff longitude
        drop_address: Human-readable dropoff address (optional, for logging)
        vehicle_type: Porter vehicle type (default: '2-wheeler')

    Returns:
        dict with keys:
          - success (bool)
          - estimated_fare (float)   — in INR
          - eta_minutes (int)        — rider pickup ETA in minutes
          - vehicle_type (str)
          - porter_quote_id (str)    — quote reference (if provided)
          - error (str)              — present only if success=False
    """
    if not is_porter_configured():
        return {
            "success": False,
            "error": "Porter API key not configured. Please set PORTER_API_KEY in .env"
        }

    payload = {
        "pickup_details": {
            "lat": RESTAURANT_LAT,
            "lng": RESTAURANT_LNG,
        },
        "drop_details": {
            "lat": drop_lat,
            "lng": drop_lng,
        },
        "customer": {
            "name":   RESTAURANT_NAME,
            "mobile": {"country_code": "+91", "number": RESTAURANT_PHONE.replace("+91", "").replace(" ", "")},
        },
        "vehicle_type": vehicle_type,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{PORTER_API_BASE}/v1/get_quote",
                json=payload,
                headers=_headers()
            )
            resp.raise_for_status()
            data = resp.json()
            logger.info(f"Porter quote response: {data}")

            # Porter returns a list of vehicle options; pick the first matching or cheapest
            vehicles = data.get("vehicles", [])
            chosen   = None

            for v in vehicles:
                if v.get("type", "").lower() == vehicle_type.lower():
                    chosen = v
                    break
            if not chosen and vehicles:
                chosen = vehicles[0]

            if not chosen:
                return {"success": False, "error": "No vehicles available from Porter right now."}

            fare_breakup  = chosen.get("fare", {})
            estimated_fare = (
                fare_breakup.get("minor_amount", 0) / 100       # Porter returns paise
                if "minor_amount" in fare_breakup
                else fare_breakup.get("amount", 0)
            )

            return {
                "success":         True,
                "estimated_fare":  round(float(estimated_fare), 2),
                "eta_minutes":     chosen.get("pickup_eta", {}).get("duration", 0),
                "vehicle_type":    chosen.get("type", vehicle_type),
                "porter_quote_id": data.get("request_id", ""),
            }

    except httpx.HTTPStatusError as e:
        body = e.response.text
        logger.error(f"Porter quote HTTP error {e.response.status_code}: {body}")
        return {"success": False, "error": f"Porter API error: {e.response.status_code} — {body[:200]}"}
    except Exception as e:
        logger.error(f"Porter quote unexpected error: {e}")
        return {"success": False, "error": str(e)}


# ── Create Order (Book Rider) ──────────────────────────────────────────────────

async def create_porter_order(
    rms_order_id:   str,
    customer_name:  str,
    customer_phone: str,
    drop_lat:       float,
    drop_lng:       float,
    drop_address:   str,
    amount:         float,
    payment_method: str = "cash",   # 'cash' or 'prepaid'
    vehicle_type:   str = "2-wheeler",
    webhook_url:    Optional[str] = None,
) -> dict:
    """
    Book a Porter rider for delivery.

    Args:
        rms_order_id:   Your internal order ID (used as merchant_order_id)
        customer_name:  Customer name for dropoff
        customer_phone: Customer phone number (10 digits)
        drop_lat/lng:   Customer delivery coordinates
        drop_address:   Human-readable delivery address
        amount:         Order amount (for COD if applicable)
        payment_method: 'cash' (COD) or 'prepaid'
        vehicle_type:   Porter vehicle category
        webhook_url:    URL Porter will POST status updates to

    Returns:
        dict with keys:
          - success (bool)
          - porter_order_id (str)     — Porter's internal order ID
          - tracking_url (str)        — Live tracking link for customer
          - rider_name (str)          — Assigned rider name (may be empty initially)
          - rider_phone (str)         — Rider phone
          - estimated_pickup_eta (int) — Minutes to pickup
          - error (str)               — Present only if success=False
    """
    if not is_porter_configured():
        return {
            "success": False,
            "error": "Porter API key not configured."
        }

    # Normalize phone: strip country code, take last 10 digits
    phone_clean = customer_phone.replace("+91", "").replace(" ", "").replace("-", "")
    if len(phone_clean) > 10:
        phone_clean = phone_clean[-10:]

    payload = {
        "merchant_order_id": rms_order_id,
        "pickup_details": {
            "lat":     RESTAURANT_LAT,
            "lng":     RESTAURANT_LNG,
            "contact_details": {
                "name":   RESTAURANT_NAME,
                "mobile": {
                    "country_code": "+91",
                    "number":       RESTAURANT_PHONE.replace("+91", "").replace(" ", "")
                }
            },
            "address": RESTAURANT_ADDRESS,
        },
        "drop_details": {
            "lat": drop_lat,
            "lng": drop_lng,
            "contact_details": {
                "name":   customer_name,
                "mobile": {
                    "country_code": "+91",
                    "number":       phone_clean
                }
            },
            "address": drop_address,
        },
        "amount": {
            "minor_amount": int(amount * 100),   # Porter uses paise
            "currency":     "INR",
        },
        "vehicle_type":    vehicle_type,
        "payment_method":  payment_method,
    }

    if webhook_url:
        payload["notifications"] = {"notify_on": ["status_change"], "url": webhook_url}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"{PORTER_API_BASE}/v1/orders/create",
                json=payload,
                headers=_headers()
            )
            resp.raise_for_status()
            data = resp.json()
            logger.info(f"Porter create order response for {rms_order_id}: {data}")

            order_data   = data.get("order", data)   # Some Porter versions wrap in "order"
            rider_data   = order_data.get("delivery_executive", {}) or {}

            return {
                "success":              True,
                "porter_order_id":      order_data.get("order_id") or data.get("order_id", ""),
                "tracking_url":         order_data.get("tracking_url") or data.get("tracking_url", ""),
                "rider_name":           rider_data.get("name", ""),
                "rider_phone":          rider_data.get("mobile", {}).get("number", "") if isinstance(rider_data.get("mobile"), dict) else rider_data.get("mobile", ""),
                "estimated_pickup_eta": order_data.get("pickup_eta", {}).get("duration", 0) if isinstance(order_data.get("pickup_eta"), dict) else 0,
                "status":               order_data.get("status", "open"),
            }

    except httpx.HTTPStatusError as e:
        body = e.response.text
        logger.error(f"Porter create order HTTP error {e.response.status_code}: {body}")
        return {"success": False, "error": f"Porter booking failed: {e.response.status_code} — {body[:300]}"}
    except Exception as e:
        logger.error(f"Porter create order unexpected error: {e}")
        return {"success": False, "error": str(e)}


# ── Get Order Status ───────────────────────────────────────────────────────────

async def get_porter_order_status(porter_order_id: str) -> dict:
    """
    Poll the current status and rider details of a Porter order.

    Returns:
        dict with keys:
          - success (bool)
          - status (str)          — Porter status string
          - tracking_url (str)
          - rider_name (str)
          - rider_phone (str)
          - error (str)           — Present only if success=False
    """
    if not is_porter_configured():
        return {"success": False, "error": "Porter not configured."}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{PORTER_API_BASE}/v1/orders/{porter_order_id}",
                headers=_headers()
            )
            resp.raise_for_status()
            data       = resp.json()
            order_data = data.get("order", data)
            rider_data = order_data.get("delivery_executive", {}) or {}

            return {
                "success":      True,
                "status":       order_data.get("status", ""),
                "tracking_url": order_data.get("tracking_url", ""),
                "rider_name":   rider_data.get("name", ""),
                "rider_phone":  rider_data.get("mobile", {}).get("number", "") if isinstance(rider_data.get("mobile"), dict) else rider_data.get("mobile", ""),
            }

    except httpx.HTTPStatusError as e:
        logger.error(f"Porter status HTTP error {e.response.status_code}: {e.response.text}")
        return {"success": False, "error": f"Porter API error: {e.response.status_code}"}
    except Exception as e:
        logger.error(f"Porter status error: {e}")
        return {"success": False, "error": str(e)}


# ── Cancel Order ───────────────────────────────────────────────────────────────

async def cancel_porter_order(porter_order_id: str, reason: str = "Cancelled by restaurant") -> dict:
    """
    Cancel an existing Porter booking.

    Returns:
        dict with keys:
          - success (bool)
          - message (str)
          - error (str)  — present if success=False
    """
    if not is_porter_configured():
        return {"success": False, "error": "Porter not configured."}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{PORTER_API_BASE}/v1/orders/{porter_order_id}/cancel",
                json={"reason": reason},
                headers=_headers()
            )
            resp.raise_for_status()
            return {"success": True, "message": "Porter booking cancelled successfully."}

    except httpx.HTTPStatusError as e:
        body = e.response.text
        logger.error(f"Porter cancel HTTP error {e.response.status_code}: {body}")
        return {"success": False, "error": f"Cancel failed: {e.response.status_code} — {body[:200]}"}
    except Exception as e:
        logger.error(f"Porter cancel error: {e}")
        return {"success": False, "error": str(e)}


# ── Webhook Signature Verification ────────────────────────────────────────────

def verify_porter_webhook(body: bytes, signature: str) -> bool:
    """
    Verify Porter webhook signature using HMAC-SHA256.
    Porter sends: X-Porter-Signature header containing the hex digest.

    If no webhook secret is configured, skip verification (dev mode).
    """
    if not PORTER_WEBHOOK_SEC:
        logger.warning("PORTER_WEBHOOK_SECRET not set — skipping signature verification (dev mode)")
        return True

    import hmac, hashlib
    expected = hmac.new(
        PORTER_WEBHOOK_SEC.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, signature or "")


# ── Porter Status → RMS Status Mapping ────────────────────────────────────────

PORTER_TO_RMS_STATUS = {
    # Porter status          : RMS order status
    "open":                    None,                # Just booked, searching rider
    "accepted":                None,                # Rider accepted, not yet picked up
    "reached_for_pickup":      None,                # Rider at restaurant
    "order_picked_up":         "out_for_delivery",  # Food is with rider
    "started_for_delivery":    "out_for_delivery",  # En route to customer
    "reached_for_delivery":    "out_for_delivery",  # Rider at customer location
    "delivered":               "delivered",          # Successfully delivered
    "cancelled":               None,                # Porter cancelled (handle separately)
}

def map_porter_status_to_rms(porter_status: str) -> Optional[str]:
    """
    Map a Porter webhook status string to an RMS order status.
    Returns None if no RMS status change is needed.
    """
    return PORTER_TO_RMS_STATUS.get(porter_status.lower(), None)
