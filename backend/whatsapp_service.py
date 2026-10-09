"""
Meta WhatsApp Cloud API Service for Persian Darbar Restaurant Management System (RMS)

This module handles:
1. Meta Webhook Verification (hub.mode, hub.verify_token, hub.challenge)
2. HMAC-SHA256 Webhook Signature Validation (X-Hub-Signature-256)
3. Parsing and processing incoming webhook events (statuses, delivery, reads, incoming messages)
4. Sending transactional WhatsApp messages (Templates and Freeform Text)
5. Linking WhatsApp message status to Customer Reservations
"""

import os
import hmac
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from collections import OrderedDict
import httpx
from dotenv import load_dotenv

# Load local environment variables
load_dotenv()

logger = logging.getLogger("whatsapp_service")
logger.setLevel(logging.INFO)

# ─── CONFIGURATION & ENVIRONMENT VARIABLES ───
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
WHATSAPP_BUSINESS_ACCOUNT_ID = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "207051877129638").strip()
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "2681861995237690").strip()
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "").strip()
WHATSAPP_API_VERSION = os.getenv("WHATSAPP_API_VERSION", "v20.0").strip()
META_APP_SECRET = os.getenv("META_APP_SECRET", "").strip()
RESERVATION_TEMPLATE_NAME = os.getenv("WHATSAPP_RESERVATION_TEMPLATE", "").strip()

# Default IST Timezone helper
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now() -> datetime:
    return datetime.now(IST)

# ─── DEDUPLICATION CACHE ───
# Bounded in-memory LRU set to avoid duplicate processing of retried webhook events
MAX_DEDUP_SIZE = 5000
_processed_events: OrderedDict[str, float] = OrderedDict()

def is_duplicate_event(event_id: str) -> bool:
    """Check if an event ID has already been processed recently"""
    if not event_id:
        return False
    if event_id in _processed_events:
        return True
    _processed_events[event_id] = datetime.now().timestamp()
    if len(_processed_events) > MAX_DEDUP_SIZE:
        _processed_events.popitem(last=False)
    return False

# ─── PHONE NUMBER FORMATTER ───
def format_whatsapp_number(phone_str: str) -> str:
    """
    Format recipient phone numbers into E.164 without leading '+' or symbols.
    For 10-digit Indian numbers, automatically prepends '91'.
    """
    if not phone_str:
        return ""
    digits = "".join(ch for ch in str(phone_str) if ch.isdigit())
    
    # 10 digits (e.g. 9594287868) -> 919594287868
    if len(digits) == 10:
        return f"91{digits}"
    # 11 digits starting with 0 -> replace 0 with 91
    if len(digits) == 11 and digits.startswith("0"):
        return f"91{digits[1:]}"
    # Already includes 91 (12 digits) or international
    return digits

# ─── WEBHOOK SIGNATURE VALIDATION ───
def verify_webhook_signature(raw_body: bytes, signature_header: Optional[str]) -> bool:
    """
    Validates Meta X-Hub-Signature-256 header using META_APP_SECRET.
    Returns True if valid or if META_APP_SECRET is not configured.
    """
    meta_secret = os.getenv("META_APP_SECRET", "").strip()
    if not meta_secret:
        # If secret is not set, allow webhook (logs info once)
        return True

    if not signature_header or not signature_header.startswith("sha256="):
        logger.warning("[WhatsApp Security] Missing or malformed X-Hub-Signature-256 header")
        return False

    expected_hash = signature_header.split("sha256=")[1]
    computed_hash = hmac.new(
        key=meta_secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_hash, computed_hash)

# ─── SENDING WHATSAPP MESSAGES ───
def _get_api_url() -> str:
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "2681861995237690").strip()
    api_version = os.getenv("WHATSAPP_API_VERSION", "v20.0").strip()
    return f"https://graph.facebook.com/{api_version}/{phone_id}/messages"

def _get_headers() -> Dict[str, str]:
    token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

async def send_whatsapp_template_message(
    to_phone: str,
    template_name: str,
    language_code: str = "en",
    components: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Sends a Meta pre-approved WhatsApp Template Message.
    Required for business-initiated conversations outside the 24-hour window.
    """
    token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    if not token:
        logger.warning("[WhatsApp] WHATSAPP_ACCESS_TOKEN not configured. Skipping message dispatch.")
        return {"success": False, "error": "WHATSAPP_ACCESS_TOKEN_MISSING"}

    formatted_recipient = format_whatsapp_number(to_phone)
    if not formatted_recipient:
        return {"success": False, "error": "INVALID_PHONE_NUMBER"}

    payload: Dict[str, Any] = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": formatted_recipient,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language_code},
        }
    }
    if components:
        payload["template"]["components"] = components

    url = _get_api_url()
    headers = _get_headers()

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            data = response.json()
            
            if response.status_code in [200, 201]:
                message_id = data.get("messages", [{}])[0].get("id")
                logger.info(f"[WhatsApp] Template '{template_name}' sent successfully to ...{formatted_recipient[-4:]}. ID: {message_id}")
                return {"success": True, "message_id": message_id, "data": data}
            else:
                error_msg = data.get("error", {}).get("message", response.text)
                logger.error(f"[WhatsApp] Meta API Error ({response.status_code}): {error_msg}")
                return {"success": False, "error": error_msg, "status_code": response.status_code, "data": data}
    except Exception as e:
        logger.error(f"[WhatsApp] Exception sending template message: {str(e)}")
        return {"success": False, "error": str(e)}

async def send_whatsapp_text_message(
    to_phone: str,
    message_text: str
) -> Dict[str, Any]:
    """
    Sends a freeform text message.
    Works for test numbers during development or within the customer 24-hour service window.
    """
    token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    if not token:
        logger.warning("[WhatsApp] WHATSAPP_ACCESS_TOKEN not configured. Skipping message dispatch.")
        return {"success": False, "error": "WHATSAPP_ACCESS_TOKEN_MISSING"}

    formatted_recipient = format_whatsapp_number(to_phone)
    if not formatted_recipient:
        return {"success": False, "error": "INVALID_PHONE_NUMBER"}

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": formatted_recipient,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message_text
        }
    }

    url = _get_api_url()
    headers = _get_headers()

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            data = response.json()

            if response.status_code in [200, 201]:
                message_id = data.get("messages", [{}])[0].get("id")
                logger.info(f"[WhatsApp] Text message sent to ...{formatted_recipient[-4:]}. ID: {message_id}")
                return {"success": True, "message_id": message_id, "data": data}
            else:
                error_msg = data.get("error", {}).get("message", response.text)
                logger.error(f"[WhatsApp] Meta Text Send Error ({response.status_code}): {error_msg}")
                return {"success": False, "error": error_msg, "status_code": response.status_code, "data": data}
    except Exception as e:
        logger.error(f"[WhatsApp] Exception sending text message: {str(e)}")
        return {"success": False, "error": str(e)}

async def send_whatsapp_document_message(
    to_phone: str,
    document_url: str,
    caption: str = "",
    filename: str = "Invoice.pdf"
) -> Dict[str, Any]:
    """
    Sends a PDF document message to the customer via Meta WhatsApp Cloud API.
    """
    token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    if not token:
        logger.warning("[WhatsApp] WHATSAPP_ACCESS_TOKEN not configured. Skipping document dispatch.")
        return {"success": False, "error": "WHATSAPP_ACCESS_TOKEN_MISSING"}

    formatted_recipient = format_whatsapp_number(to_phone)
    if not formatted_recipient:
        return {"success": False, "error": "INVALID_PHONE_NUMBER"}

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": formatted_recipient,
        "type": "document",
        "document": {
            "link": document_url,
            "caption": caption,
            "filename": filename
        }
    }

    url = _get_api_url()
    headers = _get_headers()

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            data = response.json()

            if response.status_code in [200, 201]:
                message_id = data.get("messages", [{}])[0].get("id")
                logger.info(f"[WhatsApp] Document sent successfully to ...{formatted_recipient[-4:]}. ID: {message_id}")
                return {"success": True, "message_id": message_id, "data": data}
            else:
                error_msg = data.get("error", {}).get("message", response.text)
                logger.error(f"[WhatsApp] Meta Document Send Error ({response.status_code}): {error_msg}")
                return {"success": False, "error": error_msg, "status_code": response.status_code, "data": data}
    except Exception as e:
        logger.error(f"[WhatsApp] Exception sending document message: {str(e)}")
        return {"success": False, "error": str(e)}

# ─── RESERVATION CONFIRMATION ORCHESTRATION ───
async def send_reservation_confirmation(
    reservation: Dict[str, Any],
    template_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends table booking confirmation message to customer via Meta WhatsApp Cloud API.
    If template is configured in env or passed in, dispatches approved Meta template.
    Otherwise, sends rich royal dining text message pass.
    """
    customer_phone = reservation.get("phone") or reservation.get("customer_phone")
    if not customer_phone:
        return {"success": False, "error": "NO_PHONE_NUMBER"}

    customer_name = reservation.get("customer_name") or "Valued Guest"
    date_str = reservation.get("date") or "Today"
    time_str = reservation.get("time") or "Evening"
    guests = str(reservation.get("guests") or 2)
    table_num = str(reservation.get("table_number") or "Priority Seating")
    
    active_template = template_name or os.getenv("WHATSAPP_RESERVATION_TEMPLATE", "").strip()

    if active_template:
        # Build template parameters:
        # {{1}} = Customer Name
        # {{2}} = Date
        # {{3}} = Time
        # {{4}} = Table Number
        # {{5}} = Guests
        components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": customer_name},
                    {"type": "text", "text": date_str},
                    {"type": "text", "text": time_str},
                    {"type": "text", "text": f"Table {table_num}" if not str(table_num).startswith("Table") else str(table_num)},
                    {"type": "text", "text": str(guests)}
                ]
            }
        ]
        res = await send_whatsapp_template_message(
            to_phone=customer_phone,
            template_name=active_template,
            language_code=os.getenv("WHATSAPP_TEMPLATE_LANG", "en"),
            components=components
        )
        if res.get("success"):
            return res

        logger.info(f"[WhatsApp] Template '{active_template}' delivery fallback to text message...")

    # Fallback to royal text pass without any emojis
    table_line = f"Table {table_num}" if not table_num.startswith("Table") else table_num
    text_message = (
        f"*TABLE RESERVATION CONFIRMED — PERSIAN DARBAR*\n\n"
        f"Dear *{customer_name}*,\n\n"
        f"We are delighted to confirm your dining reservation at *Persian Darbar*!\n\n"
        f"*Your Dining Pass:*\n"
        f"------------------------------------\n"
        f"*Date:* {date_str}\n"
        f"*Time Slot:* {time_str}\n"
        f"*Guests:* {guests} Guests\n"
        f"*Assigned Table:* {table_line}\n\n"
        f"*Location:* Camp, Pune\n"
        f"*Host Desk:* +91 95942 87868\n\n"
        f"*Guest Note:* Please arrive 10-15 minutes prior to your time slot. Your table is held for 15 minutes past booking time.\n\n"
        f"We look forward to welcoming you to Persian Darbar."
    )

    return await send_whatsapp_text_message(to_phone=customer_phone, message_text=text_message)

# ─── ONLINE ORDER CONFIRMATION DISPATCH (NO EMOJIS, DYNAMIC TOKEN) ───
async def send_order_confirmation(order: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sends clean transactional order confirmation WhatsApp message (strictly no emojis)
    using Meta WhatsApp Cloud API when an order is accepted/confirmed.
    """
    customer_phone = order.get("phone") or order.get("customer_phone")
    if not customer_phone:
        return {"success": False, "error": "NO_PHONE_NUMBER"}

    customer_name = order.get("customer_name") or "Valued Guest"

    # Dynamic Order Token / ID
    order_id = str(order.get("order_id") or order.get("id") or "")
    token_str = (
        order.get("bill_number")
        or order.get("kot_number")
        or (f"PD-{order_id[-6:].upper()}" if order_id else "PD-ORDER")
    )

    # Format items
    items_raw = order.get("items") or []
    items_lines = []
    for it in items_raw:
        if isinstance(it, dict):
            qty = it.get("quantity", 1)
            name = it.get("name") or it.get("item_name") or "Item"
            items_lines.append(f"  • {qty}x {name}")
        elif isinstance(it, str):
            items_lines.append(f"  • {it}")

    items_formatted = "\n".join(items_lines) if items_lines else "  • Royal Feast Selection"

    # Total and payment
    total_val = order.get("total") or order.get("subtotal") or 0
    try:
        total_str = f"{float(total_val):,.0f}"
    except Exception:
        total_str = str(total_val)

    pay_method = str(order.get("payment_method") or "").lower()
    pay_status = str(order.get("payment_status") or "").lower()
    if "cod" in pay_method or "cash" in pay_method:
        payment_info = "Cash on Delivery"
    elif ("online" in pay_method or "razorpay" in pay_method or "upi" in pay_method) and pay_status in ["paid", "completed"]:
        payment_info = "Paid Online"
    elif "online" in pay_method or "razorpay" in pay_method or "upi" in pay_method:
        payment_info = "Online / UPI"
    elif pay_status in ["paid", "completed"]:
        payment_info = "Paid Online"
    else:
        payment_info = "Pay at Counter" if str(order.get("order_type") or "").upper() == "DINE_IN" else "Cash on Delivery"

    # Order Type & Address
    order_type_raw = str(order.get("order_type") or "DELIVERY").upper()
    if order_type_raw == "TAKEAWAY":
        order_type_display = "Takeaway / Self Pickup"
        address_display = "Persian Darbar, Camp, Pune (Pickup Counter)"
        est_time = "15–25 mins"
    elif order_type_raw == "DINE_IN":
        table_no = order.get("table_number") or "Assigned"
        order_type_display = f"Dine-In (Table {table_no})"
        address_display = f"Table {table_no}, Persian Darbar"
        est_time = "15–20 mins"
    else:
        order_type_display = "Home Delivery"
        address_display = order.get("address") or "Customer Delivery Address"
        est_time = "35–45 mins"

    # Check for Meta approved template dispatch first
    order_template = os.getenv("WHATSAPP_ORDER_TEMPLATE", "order_confirmation").strip()
    if order_template:
        components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": customer_name},
                    {"type": "text", "text": str(token_str)},
                    {"type": "text", "text": str(total_str)},
                    {"type": "text", "text": str(order_type_display)},
                    {"type": "text", "text": str(order_id)},
                ]
            }
        ]
        res = await send_whatsapp_template_message(
            to_phone=customer_phone,
            template_name=order_template,
            language_code=os.getenv("WHATSAPP_TEMPLATE_LANG", "en"),
            components=components
        )
        if res.get("success"):
            return res
        logger.info(f"[WhatsApp] Order template '{order_template}' fallback to text message...")

    # Clean text message WITHOUT ANY EMOJIS (fallback)
    message_text = (
        f"*ORDER CONFIRMED — PERSIAN DARBAR*\n\n"
        f"Dear *{customer_name}*,\n"
        f"We have accepted your order! Our chefs are preparing your royal feast.\n\n"
        f"*Order Details:*\n"
        f"------------------------------------\n"
        f"*Order Token / ID:* #{token_str}\n"
        f"*Items:*\n"
        f"{items_formatted}\n"
        f"*Total Amount:* Rs {total_str} ({payment_info})\n"
        f"*Delivery Type:* {order_type_display}\n"
        f"*Address:* {address_display}\n"
        f"*Estimated Time:* {est_time}\n\n"
        f"*Live Order Tracking:*\n"
        f"https://www.persiandarbar.in/track-order/{order_id}\n\n"
        f"Helpline: +91 95942 87868"
    )

    return await send_whatsapp_text_message(to_phone=customer_phone, message_text=message_text)

# ─── ONLINE ORDER DELIVERED BILL DISPATCH (CONCISE RECEIPT & DIRECT PDF LINK) ───
async def send_order_delivered_bill(order: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sends clean transactional delivery notice with direct clickable PDF invoice link
    and dispatches the PDF invoice document via WhatsApp as soon as order is marked DELIVERED.
    Attempts Meta approved template first, falls back to text.
    """
    customer_phone = order.get("phone") or order.get("customer_phone")
    if not customer_phone:
        return {"success": False, "error": "NO_PHONE_NUMBER"}

    customer_name = order.get("customer_name") or "Valued Guest"
    order_id = str(order.get("order_id") or order.get("id") or "")
    bill_no = order.get("bill_number") or order.get("kot_number") or (f"PD-{order_id[-6:].upper()}" if order_id else "PD-BILL")

    subtotal = float(order.get("subtotal") or 0)
    gst = float(order.get("taxes") or order.get("tax") or 0)
    del_fee = float(order.get("delivery_fee") or 0)
    discount = float(order.get("discount") or 0)
    total_val = float(order.get("total") or (subtotal + gst + del_fee - discount))

    pay_method = str(order.get("payment_method") or "").lower()
    pay_status = str(order.get("payment_status") or "").lower()
    if "cod" in pay_method or "cash" in pay_method:
        payment_info = "Cash on Delivery (Collected)"
    elif "online" in pay_method or "razorpay" in pay_method or "upi" in pay_method or pay_status in ["paid", "completed"]:
        payment_info = "Paid Online"
    else:
        payment_info = "Cash on Delivery (Collected)"

    # Public link on Persian Darbar official domain
    public_invoice_url = f"https://www.persiandarbar.in/invoice/{order_id}"

    order_id_short = order_id[-6:].upper() if len(order_id) >= 6 else order_id

    # Check for Meta approved template dispatch first
    bill_template = os.getenv("WHATSAPP_BILL_TEMPLATE", "order_delivered_bill").strip()
    if bill_template:
        components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": customer_name},
                    {"type": "text", "text": str(bill_no)},
                    {"type": "text", "text": f"{total_val:,.0f}"},
                    {"type": "text", "text": str(order_id)},
                ]
            }
        ]
        res = await send_whatsapp_template_message(
            to_phone=customer_phone,
            template_name=bill_template,
            language_code=os.getenv("WHATSAPP_TEMPLATE_LANG", "en"),
            components=components
        )
        if res.get("success"):
            return res
        logger.info(f"[WhatsApp] Bill template '{bill_template}' fallback to text message...")

    message_text = (
        f"*ORDER DELIVERED — PERSIAN DARBAR*\n\n"
        f"Dear *{customer_name}*,\n"
        f"Your order has been delivered! We hope you loved your meal.\n\n"
        f"*Order Summary:*\n"
        f"*Bill / Invoice No:* #{bill_no}\n"
        f"*Order ID:* #{order_id_short}\n"
        f"*Payment:* {payment_info}\n"
        f"*Total Paid:* Rs {total_val:,.0f}\n\n"
        f"*Download Tax Invoice (PDF):*\n"
        f"{public_invoice_url}\n\n"
        f"*Rate Your Meal / Helpline:*\n"
        f"https://www.persiandarbar.in/reviews\n"
        f"Support: +91 95942 87868\n\n"
        f"Thank you for dining with Persian Darbar."
    )

    return await send_whatsapp_text_message(to_phone=customer_phone, message_text=message_text)

# ─── INCOMING WEBHOOK HANDLER ───
async def handle_whatsapp_webhook(
    payload: Dict[str, Any],
    manager: Any
) -> Dict[str, Any]:
    """
    Parses Meta WhatsApp webhook payload:
    1. Message status updates ('sent', 'delivered', 'read', 'failed')
    2. Updates corresponding reservation record with real-time delivery status
    3. Handles incoming customer replies
    """
    results: Dict[str, Any] = {
        "statuses_processed": 0,
        "messages_processed": 0,
        "updated_reservations": []
    }

    entries = payload.get("entry", [])
    if not entries:
        return results

    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            field = change.get("field", "")

            if field != "messages":
                continue

            # ── 1. STATUS UPDATES (sent, delivered, read, failed) ──
            statuses = value.get("statuses", [])
            for s in statuses:
                wamid = s.get("id")
                status = s.get("status")  # sent, delivered, read, failed
                recipient_id = s.get("recipient_id")
                timestamp = s.get("timestamp")

                if is_duplicate_event(f"status_{wamid}_{status}"):
                    continue

                logger.info(f"[WhatsApp Status] Message {wamid} for ...{str(recipient_id)[-4:]} is now: {status.upper()}")
                results["statuses_processed"] += 1

                # Update reservation in database if associated
                try:
                    all_reservations = await manager._read("reservations")
                    matched = False
                    for r in all_reservations:
                        # Match by wamid or by recipient phone
                        r_wamid = r.get("whatsapp_message_id")
                        r_phone = format_whatsapp_number(r.get("phone") or "")

                        if (r_wamid and r_wamid == wamid) or (r_phone and r_phone == recipient_id):
                            r["whatsapp_status"] = status
                            r["whatsapp_updated_at"] = get_ist_now().isoformat()
                            if s.get("errors"):
                                r["whatsapp_error"] = s.get("errors")
                            matched = True
                            rid = r.get("id") or r.get("_id")
                            results["updated_reservations"].append({"id": rid, "status": status})
                            break

                    if matched:
                        await manager._write("reservations", all_reservations)
                except Exception as db_err:
                    logger.error(f"[WhatsApp Webhook] Database update error on status: {db_err}")

            # ── 2. INCOMING MESSAGES FROM CUSTOMERS ──
            messages = value.get("messages", [])
            for m in messages:
                mid = m.get("id")
                from_num = m.get("from")
                msg_type = m.get("type")
                
                if is_duplicate_event(f"msg_{mid}"):
                    continue

                results["messages_processed"] += 1
                body_text = m.get("text", {}).get("body", "") if msg_type == "text" else f"[{msg_type} message]"
                logger.info(f"[WhatsApp Incoming] Message from ...{str(from_num)[-4:]}: {body_text[:50]}")

    return results
