from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Response, Request
from datetime import datetime, timezone, timedelta
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.orm import selectinload
import os
import logging
from pathlib import Path
from typing import List, Optional
import shutil
import random
import string
import uuid

# Import database and models
from database import init_db, close_db, get_db
from data_manager import get_data_manager, BaseDataManager
from models import *
from auth import (
    verify_password, get_password_hash, create_access_token, verify_token,
    verify_captain_token, verify_delivery_token, verify_kitchen_token,
    verify_customer_token, get_optional_customer
)
from invoice_generator import generate_invoice_pdf
import json
from whatsapp_service import (
    verify_webhook_signature,
    handle_whatsapp_webhook,
    send_reservation_confirmation,
    send_order_confirmation,
    send_order_delivered_bill,
    send_whatsapp_text_message,
    send_whatsapp_template_message
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI()

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.213.185.123:3000",
    "https://localhost",
    "capacitor://localhost",
    "https://rms.tasteofhindustan.com",
    "https://tasteofhindustan.com",
    "https://www.tasteofhindustan.com",
    "https://persiandarbar.in",
    "https://www.persiandarbar.in",
    "https://rms-kalwa2407.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"(https?://.*|capacitor://.*)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload, invoice, and sounds directories
UPLOAD_DIR = ROOT_DIR / "static" / "uploads"
INVOICE_DIR = ROOT_DIR / "static" / "invoices"
SOUNDS_DIR = ROOT_DIR / "static" / "sounds"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
INVOICE_DIR.mkdir(parents=True, exist_ok=True)
SOUNDS_DIR.mkdir(parents=True, exist_ok=True)


# Serve static files
app.mount("/static", StaticFiles(directory=str(ROOT_DIR / "static")), name="static")

# Create routers
api_router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/api/admin", tags=["admin"])
delivery_router = APIRouter(prefix="/api/delivery", tags=["delivery"])
kitchen_router = APIRouter(prefix="/api/kitchen", tags=["kitchen"])

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    origin = request.headers.get("origin")
    cors_headers = {
        "Access-Control-Allow-Origin": origin if origin else "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT",
        "Access-Control-Allow-Headers": "*",
    }
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
        headers=cors_headers,
    )


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def generate_order_id():
    """Generate a unique order ID"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"ORD{timestamp}{random_suffix}"

def generate_session_id():
    """Generate a unique session ID"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"SES{timestamp}{random_suffix}"

def generate_kot_number():
    """Generate a unique KOT (Kitchen Order Ticket) number"""
    timestamp = datetime.now().strftime('%H%M')
    random_suffix = ''.join(random.choices(string.digits, k=3))
    return f"KOT{timestamp}{random_suffix}"

async def generate_bill_number(manager) -> str:
    """
    Generate a monthly sequential bill number in the format MMMXXX.
    e.g. JAN001, JAN002 ... FEB001, FEB002 ...
    Resets to 001 at the start of each month.
    Counts across BOTH table_sessions (dine-in) AND orders (online/delivery/takeaway)
    so the sequence is shared and unique across all order types.
    """
    now_ist = get_ist_now()
    month_abbr = now_ist.strftime('%b').upper()   # 'JAN', 'FEB', ...
    year_month  = now_ist.strftime('%Y-%m')        # '2026-01', used to detect month boundary

    session_count = 0
    order_count   = 0

    # Count from dine-in table sessions
    try:
        sessions = await manager._read("table_sessions")
        session_count = sum(
            1 for s in sessions
            if s.get("bill_number", "").startswith(month_abbr)
            and s.get("bill_year_month") == year_month
        )
    except Exception:
        session_count = 0

    # Count from online/delivery/takeaway orders
    try:
        orders = await manager._read("orders")
        order_count = sum(
            1 for o in orders
            if o.get("bill_number", "").startswith(month_abbr)
            and o.get("bill_year_month") == year_month
        )
    except Exception:
        order_count = 0

    seq = session_count + order_count + 1
    return f"{month_abbr}{seq:03d}", year_month

def get_ist_now():
    """Get current IST datetime"""
    return datetime.now(timezone(timedelta(hours=5, minutes=30)))


def apply_coin_expiry(customer: dict) -> dict:
    """
    Auto-expire PD Coins that were earned more than 45 days ago.
    Mutates and returns the customer dict with updated pd_coins and coins_history.
    Safe to call on every profile read â€” idempotent (won't double-expire).
    """
    EXPIRY_DAYS = 45
    now = get_ist_now()
    history = customer.get("coins_history", [])
    newly_expired = 0

    updated_history = []
    for entry in history:
        if entry.get("type") == "earned" and not entry.get("expired"):
            try:
                ts_str = entry.get("timestamp", "")
                # Parse timestamp (handle both tz-aware and naive)
                if "+" in ts_str or ts_str.endswith("Z"):
                    from dateutil import parser as dateparser
                    earned_at = dateparser.parse(ts_str)
                    if earned_at.tzinfo is None:
                        earned_at = earned_at.replace(tzinfo=timezone(timedelta(hours=5, minutes=30)))
                else:
                    earned_at = datetime.fromisoformat(ts_str).replace(
                        tzinfo=timezone(timedelta(hours=5, minutes=30))
                    )
                age_days = (now - earned_at).days
                if age_days >= EXPIRY_DAYS:
                    coins_lost = entry.get("coins", 0)
                    newly_expired += coins_lost
                    updated_history.append({**entry, "expired": True})
                    continue
            except Exception:
                pass
        updated_history.append(entry)

    if newly_expired > 0:
        # Append a visible expiry record to history
        updated_history.append({
            "type": "expired",
            "coins": newly_expired,
            "balance_after": max(0, (customer.get("pd_coins", 0) - newly_expired)),
            "note": f"{newly_expired} coins auto-expired (45-day policy)",
            "timestamp": now.isoformat(),
        })
        # Recalculate fresh balance from non-expired history
        earned   = sum(e["coins"] for e in updated_history if e.get("type") == "earned" and not e.get("expired"))
        redeemed = sum(e["coins"] for e in updated_history if e.get("type") in ("redeemed", "expired"))
        customer["pd_coins"] = max(0, earned - redeemed)
        customer["coins_history"] = updated_history

    return customer


async def create_order_invoice(order_id: str, manager: BaseDataManager):
    """Generate invoice PDF for an order"""
    try:
        order = await manager.get_order_by_id(order_id)
        if not order:
            logger.error(f"Order not found: {order_id}")
            return None
        
        # Ensure monthly sequential bill number is assigned
        if not order.get("bill_number"):
            bill_number, year_month = await generate_bill_number(manager)
            order["bill_number"] = bill_number
            order["bill_year_month"] = year_month
            await manager.update_order(order_id, {"bill_number": bill_number, "bill_year_month": year_month})

        # Generate PDF
        invoice_filename = f"invoice_{order_id}.pdf"
        invoice_path = INVOICE_DIR / invoice_filename
        generate_invoice_pdf(order, str(invoice_path))
        
        # Update order with official public invoice URL
        invoice_url = f"https://www.persiandarbar.in/api/invoice/{order_id}"
        await manager.update_order(order_id, {"invoice_url": invoice_url})
        
        return invoice_url
    except Exception as e:
        logger.error(f"Error generating invoice for {order_id}: {str(e)}")
        return None

# =============================================================================
# DATABASE INITIALIZATION
# =============================================================================

async def seed_database():
    """Seed initial data into the database"""
    async with AsyncSessionLocal() as db:
        try:
            # Check if admin exists with new username
            result = await db.execute(select(AdminUserDB).where(AdminUserDB.username == "Vijay@Persiandarbar"))
            admin = result.scalar_one_or_none()
            
            if not admin:
                # Delete old admin users if exists
                await db.execute(delete(AdminUserDB).where(AdminUserDB.username == "admin"))
                await db.execute(delete(AdminUserDB).where(AdminUserDB.username == "Viay@Persiandarbar"))
                
                admin = AdminUserDB(
                    username="Vijay@Persiandarbar",
                    password=get_password_hash("Vijay@123")
                )
                db.add(admin)
                await db.commit()
                logger.info("Admin user created successfully")
            
            # Check if menu items exist
            result = await db.execute(select(func.count(MenuItemDB.id)))
            menu_count = result.scalar()
            
            if menu_count == 0:
                mock_menu = [
                    {"name": "Chicken Biryani", "category": "Main Course", "description": "Aromatic basmati rice with tender chicken", "price": 350.0, "popular": True, "veg": False, "spicy_level": 2, "preparation_time": 25},
                    {"name": "Paneer Tikka", "category": "Starters", "description": "Grilled cottage cheese with spices", "price": 280.0, "popular": True, "veg": True, "spicy_level": 1, "preparation_time": 15},
                    {"name": "Mutton Kebab", "category": "Starters", "description": "Juicy minced mutton kebabs", "price": 420.0, "popular": False, "veg": False, "spicy_level": 2, "preparation_time": 20},
                    {"name": "Dal Makhani", "category": "Main Course", "description": "Creamy black lentils", "price": 220.0, "popular": True, "veg": True, "spicy_level": 0, "preparation_time": 15},
                    {"name": "Butter Naan", "category": "Breads", "description": "Soft buttered flatbread", "price": 60.0, "popular": True, "veg": True, "spicy_level": 0, "preparation_time": 10},
                ]
                
                for item_data in mock_menu:
                    menu_item = MenuItemDB(**item_data)
                    db.add(menu_item)
                
                await db.commit()
                logger.info("Mock menu items seeded")
            
            # Check if tables exist
            result = await db.execute(select(func.count(TableDB.id)))
            table_count = result.scalar()
            
            if table_count == 0:
                for i in range(1, 45):  # 44 tables
                    table = TableDB(table_number=i, capacity=4, status="free")
                    db.add(table)
                await db.commit()
                logger.info("44 tables created")
            
            # Check if orders exist for analytics
            result = await db.execute(select(func.count(OrderDB.id)))
            order_count = result.scalar()
            
            if order_count == 0:
                # Create mock orders for the last 7 days
                order_statuses = ["delivered", "delivered", "delivered", "cancelled", "preparing"]
                for day_offset in range(7):
                    order_date = datetime.now() - timedelta(days=day_offset)
                    for i in range(random.randint(2, 4)):
                        order = OrderDB(
                            order_id=generate_order_id(),
                            customer_name=f"Customer {random.randint(1, 100)}",
                            phone=f"98765{random.randint(10000, 99999)}",
                            address=f"Address {random.randint(1, 50)}, Mumbai",
                            items=[{
                                "item_id": "mock",
                                "name": "Chicken Biryani",
                                "price": 350.0,
                                "quantity": random.randint(1, 3),
                            }],
                            subtotal=350.0 * random.randint(1, 3),
                            taxes=17.5 * random.randint(1, 3),
                            total=367.5 * random.randint(1, 3),
                            payment_method="cod",
                            payment_status="paid" if random.choice(order_statuses) == "delivered" else "pending",
                            status=random.choice(order_statuses),
                            order_type="DELIVERY",
                            status_history=[{"status": "placed", "timestamp": order_date.isoformat()}],
                            created_at=order_date
                        )
                        db.add(order)
                
                await db.commit()
                logger.info(f"Mock orders seeded")
            
            logger.info("Database initialization complete")
            
        except Exception as e:
            logger.error(f"Error seeding database: {str(e)}")
            await db.rollback()
            raise

# =============================================================================
# PUBLIC ENDPOINTS
# =============================================================================

# Menu Endpoints
@api_router.get("/menu")
async def get_menu(category: str = None, manager: BaseDataManager = Depends(get_data_manager)):
    """Get all available menu items â€” cached 10 min"""
    items = await manager.get_menu(category)
    return JSONResponse(
        content=items,
        headers={"Cache-Control": "public, max-age=600, stale-while-revalidate=60"}
    )

@api_router.get("/menu/categories")
async def get_menu_categories(manager: BaseDataManager = Depends(get_data_manager)):
    """Get all unique menu categories"""
    categories = await manager.get_menu_categories()
    return {"categories": categories}

@api_router.get("/menu/{item_id}")
async def get_menu_item(item_id: str, manager: BaseDataManager = Depends(get_data_manager)):
    """Get a specific menu item"""
    item = await manager.get_menu_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item

@api_router.get("/tables")
async def get_tables(manager: BaseDataManager = Depends(get_data_manager)):
    """Get all tables for reservation"""
    return await manager.get_tables()

@api_router.get("/tables/stream")
async def stream_table_status(request: Request, manager: BaseDataManager = Depends(get_data_manager)):
    """SSE stream â€” pushes live table status every 3 seconds to customer dashboard"""
    import asyncio, json as _json

    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            try:
                tables = await manager.get_tables()
                payload = _json.dumps(tables)
                yield f"data: {payload}\n\n"
            except Exception as e:
                yield f"data: {_json.dumps({'error': str(e)})}\n\n"
            await asyncio.sleep(60)  # 60s â€” customer-facing; reduce Firestore reads

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


# Gallery Endpoints
@api_router.get("/gallery")
async def get_gallery(manager: BaseDataManager = Depends(get_data_manager)):
    """Get all gallery images — cached 5 min"""
    images = await manager.get_gallery()
    normalized = []
    for img in images:
        item = dict(img)
        url = item.get("image_url") or item.get("url") or ""
        item["image_url"] = url
        item["url"] = url
        # Auto-detect category if missing
        if not item.get("category"):
            caption_lower = (item.get("caption") or "").lower()
            if any(w in caption_lower for w in ["biryani", "roll", "dish", "kebab", "kabab", "food", "platter", "curry", "rice", "naan"]):
                item["category"] = "Food"
            elif any(w in caption_lower for w in ["event", "banquet", "celebration", "party", "ghazal", "sufi"]):
                item["category"] = "Events"
            elif any(w in caption_lower for w in ["royal", "shahi", "gold", "darbar", "thali", "dastarkhwan"]):
                item["category"] = "Royal"
            else:
                item["category"] = "Ambience"
        normalized.append(item)
    return JSONResponse(
        content=normalized,
        headers={"Cache-Control": "public, max-age=300, stale-while-revalidate=60"}
    )

# Reviews Endpoints
@api_router.get("/reviews")
async def get_reviews(manager: BaseDataManager = Depends(get_data_manager)):
    """Get all approved/published reviews"""
    all_reviews = await manager.get_reviews()
    # Only return approved reviews (those without pending=True)
    return [r for r in all_reviews if not r.get("pending", False)]

@api_router.post("/reviews")
async def submit_review(review_data: dict, manager: BaseDataManager = Depends(get_data_manager)):
    """Submit a public review â€” saved as pending for admin approval"""
    import uuid, datetime
    name = str(review_data.get("name", "")).strip()
    text = str(review_data.get("text", "")).strip()
    rating = int(review_data.get("rating", 5))
    customer_uid = review_data.get("customer_uid", "")

    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    if not text or len(text) < 10:
        raise HTTPException(status_code=400, detail="Review must be at least 10 characters")
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    review = {
        "_id": str(uuid.uuid4()),
        "name": name,
        "text": text,
        "rating": rating,
        "date": datetime.datetime.utcnow().isoformat(),
        "created_at": datetime.datetime.utcnow().isoformat(),
        "customer_uid": customer_uid,
        "pending": True,  # Requires admin approval
    }

    reviews = await manager._read("reviews")
    reviews.append(review)
    await manager._write("reviews", reviews)
    return {"message": "Review submitted successfully. It will be visible after admin approval.", "id": review["_id"]}

@api_router.get("/settings/public")
async def get_public_settings(manager: BaseDataManager = Depends(get_data_manager)):
    """Get public settings like contact info"""
    settings = await manager.get_settings()
    public_keys = ["contact_address", "contact_phone", "contact_email", "opening_hours"]
    return {k: v for k, v in settings.items() if k in public_keys}

# =============================================================================
# OFFERS / PROMOTIONS (Public + Admin)
# =============================================================================

@api_router.get("/offers")
async def get_public_offers(manager: BaseDataManager = Depends(get_data_manager)):
    """
    Public endpoint: returns active offers for the customer app.
    Respects:
      1. Global master toggle (offers_master_enabled in settings)
      2. Individual offer active flag
      3. Date range (start_date / end_date in IST)
    """
    settings = await manager.get_settings()
    if not settings.get("offers_master_enabled", True):
        return []   # Master toggle OFF → no offers shown

    try:
        offers = await manager._read("offers")
    except Exception:
        offers = []

    now_ist = get_ist_now().date()
    active = []
    for o in offers:
        if not o.get("active", False):
            continue
        # Date-range check
        try:
            start = datetime.strptime(o["start_date"], "%Y-%m-%d").date() if o.get("start_date") else None
            end   = datetime.strptime(o["end_date"],   "%Y-%m-%d").date() if o.get("end_date")   else None
            if start and now_ist < start:
                continue
            if end and now_ist > end:
                continue
        except Exception:
            pass
        active.append(o)

    return sorted(active, key=lambda x: x.get("sort_order", 999))


@admin_router.get("/offers")
async def admin_get_offers(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Admin: get all offers (including inactive)"""
    try:
        offers = await manager._read("offers")
    except Exception:
        offers = []
    settings = await manager.get_settings()
    return {
        "offers": sorted(offers, key=lambda x: x.get("sort_order", 999)),
        "master_enabled": settings.get("offers_master_enabled", True)
    }


@admin_router.post("/offers/master-toggle")
async def admin_toggle_offers_master(
    body: dict,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Admin: toggle the global offers master switch"""
    enabled = body.get("enabled", True)
    try:
        if hasattr(manager, "update_setting"):
            await manager.update_setting("offers_master_enabled", enabled)
        if hasattr(manager, "update_settings"):
            settings = await manager.get_settings()
            settings["offers_master_enabled"] = enabled
            await manager.update_settings(settings)
    except Exception as e:
        logger.error(f"Error updating offers master toggle in settings: {e}")
        try:
            if hasattr(manager, "_write"):
                settings = await manager.get_settings()
                settings["offers_master_enabled"] = enabled
                settings_list = [{"key": k, "value": v} for k, v in settings.items()]
                await manager._write("settings", settings_list)
        except Exception as inner_e:
            logger.error(f"Fallback write error: {inner_e}")
    return {"master_enabled": enabled}


@admin_router.post("/offers")
async def admin_create_offer(
    offer: dict,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Admin: create a new offer"""
    import uuid
    offer["id"] = f"offer_{uuid.uuid4().hex[:8]}"
    offer.setdefault("active", False)
    offer.setdefault("sort_order", 999)
    offer["created_at"] = get_ist_now().isoformat()
    try:
        offers = await manager._read("offers")
    except Exception:
        offers = []
    offers.append(offer)
    await manager._write("offers", offers)
    return offer


@admin_router.put("/offers/{offer_id}")
async def admin_update_offer(
    offer_id: str,
    updates: dict,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Admin: update/toggle an offer"""
    try:
        offers = await manager._read("offers")
    except Exception:
        offers = []
    idx = next((i for i, o in enumerate(offers) if o.get("id") == offer_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Offer not found")
    offers[idx].update(updates)
    await manager._write("offers", offers)
    return offers[idx]


@admin_router.delete("/offers/{offer_id}")
async def admin_delete_offer(
    offer_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Admin: delete an offer"""
    try:
        offers = await manager._read("offers")
    except Exception:
        offers = []
    offers = [o for o in offers if o.get("id") != offer_id]
    await manager._write("offers", offers)
    return {"deleted": offer_id}


@api_router.post("/coupons/validate")
async def validate_coupon(coupon_validation: CouponValidation, manager: BaseDataManager = Depends(get_data_manager)):
    """Validate a coupon code"""
    coupon = await manager.validate_coupon(coupon_validation.code)
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if coupon_validation.order_value < coupon.get("min_order_value", 0):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order value of â‚¹{coupon.get('min_order_value')} required"
        )
    
    # In Mock mode, we'll assume basic validation for now to keep it simple
    discount = 0.0
    if coupon.get("discount_type") == "percentage":
        discount = (coupon_validation.order_value * coupon.get("discount_value", 0)) / 100
        if coupon.get("max_discount"):
            discount = min(discount, coupon.get("max_discount"))
    else:
        discount = coupon.get("discount_value", 0)
    
    return {
        "valid": True,
        "discount": discount,
        "discount_type": coupon.get("discount_type"),
        "discount_value": coupon.get("discount_value"),
        "code": coupon.get("code")
    }


@api_router.get("/coupons/public")
async def get_public_coupons(manager: BaseDataManager = Depends(get_data_manager)):
    """Get active public coupons for customer checkout"""
    try:
        coupons = await manager._read("coupons")
        return [c for c in coupons if c.get("active", True)]
    except Exception:
        return []

# Orders Endpoints
@api_router.post("/orders")
async def create_order(
    order: OrderCreate,
    manager: BaseDataManager = Depends(get_data_manager),
    optional_customer: Optional[dict] = Depends(get_optional_customer)
):
    """Create a new order with validation. Handles PD Coins redemption and re-award."""

    if order.order_type == "DELIVERY" and order.subtotal < 250:
        raise HTTPException(
            status_code=400,
            detail="Minimum order value is â‚¹250 for delivery"
        )

    # â”€â”€ Delivery range enforcement â”€â”€
    if order.order_type == "DELIVERY":
        km = order.distance_km or 0
        if km > 20:
            raise HTTPException(
                status_code=400,
                detail="Out of delivery range. We only deliver within 20km."
            )
        elif km > 10:
            order.delivery_fee = 60.0
        else:
            order.delivery_fee = 0.0

    now = get_ist_now()
    order_dict = order.dict()
    order_id = generate_order_id()

    # â”€â”€ Resolve customer identity: Token -> Payload customer_uid -> Phone -> Email â”€â”€
    customer_uid = (optional_customer.get("uid") if optional_customer else None) or order_dict.get("customer_uid")
    if customer_uid and not order_dict.get("customer_uid"):
        order_dict["customer_uid"] = customer_uid

    customer_phone = (order_dict.get("phone") or "").strip().replace(" ", "").replace("-", "")
    customer_email = (order_dict.get("email") or "").strip().lower()

    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    # PD COINS REDEMPTION & CASHBACK â€” Server-side validation
    # â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    coins_redeemed = 0
    coins_discount_applied = 0.0
    coins_earned_back = 0
    requested_coins = int(order_dict.get("coins_to_redeem", 0))

    try:
        customers = await manager._read("customers")
        cust_idx = None

        if customer_uid:
            cust_idx = next((i for i, c in enumerate(customers) if c.get("uid") == customer_uid or c.get("_id") == customer_uid), None)

        if cust_idx is None and len(customer_phone) >= 10:
            last_10 = customer_phone[-10:]
            cust_idx = next((i for i, c in enumerate(customers) if (c.get("phone") or "").replace(" ", "").replace("-", "").endswith(last_10)), None)

        if cust_idx is None and customer_email:
            cust_idx = next((i for i, c in enumerate(customers) if (c.get("email") or "").lower() == customer_email), None)

        if cust_idx is not None:
            customer = customers[cust_idx]

            # Auto-link UID, phone, address if missing
            if customer_uid and not customer.get("uid"):
                customer["uid"] = customer_uid
            if customer_phone and not customer.get("phone"):
                customer["phone"] = order_dict["phone"].strip()
            if order_dict.get("address") and not customer.get("address"):
                customer["address"] = order_dict["address"].strip()
                customer.setdefault("addresses", []).append(order_dict["address"].strip())

            # Always sweep expiry before any balance operation
            customer = apply_coin_expiry(customer)
            available_coins = customer.get("pd_coins", 0)

            COINS_MIN_BILL    = 300     # Minimum subtotal to allow redemption
            COINS_MAX_BURN_PC = 0.25    # Max 25% of subtotal can be paid in coins

            if requested_coins > 0 and order.subtotal >= COINS_MIN_BILL:
                max_allowed = int(order.subtotal * COINS_MAX_BURN_PC)
                coins_redeemed = min(requested_coins, available_coins, max_allowed)

            new_coin_balance = available_coins

            if coins_redeemed > 0:
                coins_discount_applied = float(coins_redeemed)  # 1 coin = â‚¹1
                new_coin_balance -= coins_redeemed

                # Recalculate total with discount applied
                net_subtotal = order.subtotal - coins_discount_applied
                new_total    = net_subtotal + order_dict.get("delivery_fee", 0.0) + order_dict.get("taxes", 0.0)
                new_total    = max(1.0, round(new_total, 2))  # Never go below â‚¹1

                # Auto-award 10% on NET paid amount
                coins_earned_back = int(net_subtotal * 0.10)

                redemption_txn = {
                    "type": "redeemed",
                    "coins": coins_redeemed,
                    "discount_value": coins_discount_applied,
                    "balance_after": new_coin_balance,
                    "note": f"Online order #{order_id[-8:]} â€” â‚¹{coins_discount_applied:.0f} discount",
                    "order_id": order_id,
                    "timestamp": now.isoformat(),
                }
                customer.setdefault("coins_history", []).append(redemption_txn)

                if coins_earned_back > 0:
                    earn_balance_after = new_coin_balance + coins_earned_back
                    earn_txn = {
                        "type": "earned",
                        "coins": coins_earned_back,
                        "bill_amount": net_subtotal,
                        "balance_after": earn_balance_after,
                        "note": f"10% cashback on online order #{order_id[-8:]} (net â‚¹{net_subtotal:.0f})",
                        "order_id": order_id,
                        "timestamp": now.isoformat(),
                    }
                    customer["coins_history"].append(earn_txn)
                    new_coin_balance = earn_balance_after

                customer["pd_coins"]   = new_coin_balance
                customer["updated_at"] = now.isoformat()
                customers[cust_idx]    = customer
                await manager._write("customers", customers)

                # Patch order financials with server-validated coin discount
                order_dict["discount"]       = coins_discount_applied
                order_dict["coins_redeemed"] = coins_redeemed
                order_dict["coins_discount"] = coins_discount_applied
                order_dict["coins_earned"]   = coins_earned_back
                order_dict["total"]          = new_total
            else:
                # No coins redeemed, but award 10% cashback on order subtotal for registered customer
                if order.subtotal >= 100:
                    coins_earned_back = int(order.subtotal * 0.10)
                    if coins_earned_back > 0:
                        earn_balance_after = new_coin_balance + coins_earned_back
                        earn_txn = {
                            "type": "earned",
                            "coins": coins_earned_back,
                            "bill_amount": order.subtotal,
                            "balance_after": earn_balance_after,
                            "note": f"10% cashback on online order #{order_id[-8:]}",
                            "order_id": order_id,
                            "timestamp": now.isoformat(),
                        }
                        customer.setdefault("coins_history", []).append(earn_txn)
                        customer["pd_coins"]   = earn_balance_after
                        customer["updated_at"] = now.isoformat()
                        customers[cust_idx]    = customer
                        await manager._write("customers", customers)
                        order_dict["coins_earned"] = coins_earned_back
                else:
                    # Just update customer profile if address/phone was updated
                    customer["updated_at"] = now.isoformat()
                    customers[cust_idx]    = customer
                    await manager._write("customers", customers)
    except Exception as e:
        print(f"Error processing customer loyalty for order {order_id}: {e}")

    # Generate monthly sequential bill number (e.g. OCT001)
    bill_number, year_month = await generate_bill_number(manager)

    order_dict.update({
        "order_id": order_id,
        "bill_number": bill_number,
        "bill_year_month": year_month,
        "payment_status": "pending",
        "status": "placed",
        "status_history": [{
            "status": "placed",
            "timestamp": now.isoformat(),
            "note": f"Order placed successfully - {order_dict.get('order_type', 'DELIVERY')}"
        }],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    })

    if order_dict.get("order_type") == "DINE_IN":
        order_dict["delivery_fee"] = 0.0
        order_dict["payment_method"] = "pay_at_counter"
        if order.table_number:
            await manager.update_table_status(order.table_number, "occupied", order_id)
    elif order_dict.get("order_type") == "TAKEAWAY":
        order_dict["delivery_fee"] = 0.0
    else:
        order_dict["estimated_delivery_time"] = (now + timedelta(minutes=35)).isoformat()

    created_order = await manager.create_order(order_dict)
    return created_order


@api_router.post("/table-order")
async def create_table_order(order: TableOrderCreate, manager: BaseDataManager = Depends(get_data_manager)):
    """Create a dine-in order from table QR code"""
    
    if not order.table_number or order.table_number < 1:
        raise HTTPException(status_code=400, detail="Valid table number is required")
    
    if not order.items or len(order.items) == 0:
        raise HTTPException(status_code=400, detail="At least one item is required")
    
    now = get_ist_now()
    order_id = generate_order_id()
    
    order_data = {
        "order_id": order_id,
        "customer_name": order.customer_name or "Guest",
        "phone": order.phone or "",
        "address": f"Table {order.table_number}",
        "items": [item.dict() for item in order.items],
        "subtotal": order.subtotal,
        "discount": 0.0,
        "delivery_fee": 0.0,
        "taxes": order.taxes,
        "total": order.total,
        "payment_method": "pay_at_counter",
        "payment_status": "pending",
        "status": "placed",
        "order_type": "DINE_IN",
        "table_number": order.table_number,
        "status_history": [{
            "status": "placed",
            "timestamp": now.isoformat(),
            "note": f"Dine-in order placed from Table {order.table_number}"
        }],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await manager.update_table_status(order.table_number, "occupied", order_id)
    created_order = await manager.create_order(order_data)
    
    return created_order

# =============================================================================
# TABLE SESSION ENDPOINTS
# =============================================================================

@api_router.get("/table/{table_number}/session")
async def get_table_session(table_number: int, manager: BaseDataManager = Depends(get_data_manager)):
    """Check if table has an active session"""
    tables = await manager.get_tables()
    table = next((t for t in tables if t.get("table_number") == table_number), None)
    
    if table and table.get("status") == "occupied" and table.get("current_session_id"):
        session = await manager.get_table_session(table["current_session_id"])
        if session:
            session_dict = session.copy()
            # Get all orders in this session
            orders = []
            for order_id in session.get("order_ids", []):
                order = await manager.get_order_by_id(order_id)
                if order:
                    orders.append(order)
            session_dict["orders"] = orders
            return {"has_session": True, "session": session_dict}
    
    return {"has_session": False, "session": None}

@api_router.post("/table/session/start")
async def start_table_session(data: TableSessionCreate, manager: BaseDataManager = Depends(get_data_manager)):
    """Start a new table session"""
    # Check for existing session
    sessions = await manager._read("table_sessions")
    existing = None
    for s in sessions:
        if s.get("table_number") == data.table_number and s.get("status") in ["pending", "active"]:
            existing = s
            break
            
    if existing:
        # If the same customer name, resume the existing session
        if existing.get("customer_name", "").lower() == data.customer_name.lower():
            return {"session": existing, "message": "Session already exists"}
        
        # Different customer â€” TABLE IS LOCKED: reject with 409 Conflict
        raise HTTPException(
            status_code=409,
            detail=f"Table {data.table_number} is currently occupied. Please wait until the current bill is settled before seating."
        )
    
    now = datetime.utcnow()
    session_id = generate_session_id()
    session = {
        "session_id": session_id,
        "table_number": data.table_number,
        "customer_name": data.customer_name,
        "status": "pending",
        "order_ids": [],
        "subtotal": 0.0,
        "total": 0.0,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await manager.create_table_session(session)
    
    return {"session": session, "message": "Session created"}

@api_router.post("/table/session/order")
async def add_order_to_session(data: DineInOrderCreate, manager: BaseDataManager = Depends(get_data_manager)):
    """Add order to table session"""
    now = get_ist_now()
    
    session = None
    if data.session_id:
        session = await manager.get_table_session(data.session_id)
    else:
        # Try to find by table number
        tables = await manager.get_tables()
        table = next((t for t in tables if t["table_number"] == data.table_number), None)
        if table and table.get("current_session_id"):
            session = await manager.get_table_session(table["current_session_id"])
    
    if not session:
        session_id = generate_session_id()
        session = await manager.create_table_session({
            "session_id": session_id,
            "table_number": data.table_number,
            "customer_name": data.customer_name,
            "status": "active",
            "order_ids": [],
            "subtotal": 0.0,
            "total": 0.0
        })
    
    subtotal = sum(item.price * item.quantity for item in data.items)
    taxes = round(subtotal * 0.05, 2)
    total = subtotal + taxes
    
    order_id = generate_order_id()
    order_data = {
        "order_id": order_id,
        "session_id": session["session_id"],
        "customer_name": data.customer_name or session["customer_name"],
        "phone": "",
        "address": f"Table {data.table_number}",
        "items": [item.dict() for item in data.items],
        "subtotal": subtotal,
        "discount": 0.0,
        "taxes": taxes,
        "total": total,
        "status": "placed",
        "order_type": "DINE_IN",
        "table_number": data.table_number,
        "created_at": now.isoformat()
    }
    
    created_order = await manager.create_order(order_data)
    
    # Update session
    order_ids = session.get("order_ids", [])
    order_ids.append(order_id)
    await manager.update_table_session(session["session_id"], {
        "order_ids": order_ids,
        "subtotal": session.get("subtotal", 0.0) + subtotal,
        "total": session.get("total", 0.0) + total
    })
    
    return {"order": created_order, "message": "Order added to session"}

@api_router.get("/table/session/{session_id}/status")
async def get_session_status(session_id: str, manager: BaseDataManager = Depends(get_data_manager)):
    """Get full session status with all orders"""
    session = await manager.get_table_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_dict = session.copy()
    
    # Get all orders
    orders = []
    for order_id in session.get("order_ids", []):
        order = await manager.get_order_by_id(order_id)
        if order:
            orders.append(order)
            
    session_dict["orders"] = orders
    
    # Calculate totals
    active_orders = [o for o in orders if o.get("status") not in ["cancelled", "rejected", "pending_approval"]]
    session_dict["subtotal"] = sum(o.get("subtotal", 0) for o in active_orders)
    session_dict["taxes"] = sum(o.get("taxes", 0) for o in active_orders)
    session_dict["total"] = sum(o.get("total", 0) for o in active_orders)
    
    return session_dict

# =============================================================================
# ORDER ENDPOINTS
# =============================================================================

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, manager: BaseDataManager = Depends(get_data_manager)):
    """Get order by order_id"""
    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.post("/orders/{order_id}/cancel")
async def request_order_cancellation(order_id: str, cancellation: OrderCancellationRequest, manager: BaseDataManager = Depends(get_data_manager)):
    """Request order cancellation"""
    order = await manager.get_order_by_id(order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("status") in ["delivered", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel order in current status")
    
    now = get_ist_now()
    status_update = {
        "status": "cancelled",
        "timestamp": now.isoformat(),
        "note": f"Cancelled by customer. Reason: {cancellation.reason}"
    }
    
    await manager.update_order_status(order_id, "cancelled", status_update)
    return {"message": "Order cancellation requested", "status": "cancelled"}

@api_router.get("/orders/customer/{phone}")
async def get_customer_orders(phone: str, manager: BaseDataManager = Depends(get_data_manager)):
    """Get all orders for a customer by phone number"""
    # This would ideally be a manager method, but we can filter here for now
    # Since it's Mock Firebase, we'll implement a helper if needed or just filter all orders
    all_orders = await manager._read("orders") # Internal read for flexibility
    customer_orders = [o for o in all_orders if o.get("phone") == phone]
    return sorted(customer_orders, key=lambda x: x.get("created_at", ""), reverse=True)

@api_router.post("/reservations")
async def create_reservation(
    reservation: ReservationCreate,
    manager: BaseDataManager = Depends(get_data_manager),
    optional_customer: Optional[dict] = Depends(get_optional_customer)
):
    """Create a new reservation"""
    now = get_ist_now()
    reservation_data = reservation.dict()
    
    # Check for duplicate bookings at the same date, time, and table
    existing_reservations = await manager._read("reservations")
    for r in existing_reservations:
        if r.get("date") == reservation_data.get("date") and r.get("time") == reservation_data.get("time"):
            if reservation_data.get("table_number") and r.get("table_number") == reservation_data.get("table_number") and r.get("status") in ["confirmed", "pending"]:
                raise HTTPException(status_code=409, detail=f"Table {reservation_data.get('table_number')} is already booked for {reservation_data.get('time')} on this date.")
            elif not reservation_data.get("table_number") and r.get("status") == "confirmed" and r.get("customer_name") == reservation_data.get("customer_name"):
                raise HTTPException(status_code=409, detail="A reservation already exists for this name and time.")

    # Auto-link customer if authenticated
    if not reservation_data.get("customer_uid") and optional_customer:
        reservation_data["customer_uid"] = optional_customer["uid"]

    # Auto-save phone to customer profile if empty
    if optional_customer and reservation_data.get("phone"):
        try:
            customers = await manager._read("customers")
            for c in customers:
                if c.get("uid") == optional_customer["uid"]:
                    if not c.get("phone"):
                        c["phone"] = reservation_data["phone"].strip()
                    await manager._write("customers", customers)
                    break
        except Exception:
            pass

    reservation_data.update({
        "status": "pending",
        "whatsapp_sent": False,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    })
    
    created_res = await manager.create_reservation(reservation_data)
    return created_res

@api_router.get("/reservations/{reservation_id}")
async def get_reservation(reservation_id: str, manager: BaseDataManager = Depends(get_data_manager)):
    """Get reservation by ID"""
    reservations = await manager._read("reservations")
    reservation = next((r for r in reservations if r.get("id") == reservation_id or r.get("_id") == reservation_id), None)
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    return reservation


# =============================================================================
# META WHATSAPP CLOUD API PRODUCTION WEBHOOK ENDPOINTS
# =============================================================================

@api_router.get("/whatsapp/webhook")
async def verify_whatsapp_webhook(request: Request):
    """
    Meta WhatsApp Cloud API Webhook Verification.
    Meta issues a GET request with:
      - hub.mode = 'subscribe'
      - hub.verify_token = '<YOUR_CUSTOM_VERIFY_TOKEN>'
      - hub.challenge = '<RANDOM_CHALLENGE_STRING>'

    Verification Protocol:
    1. Read 'hub.verify_token' and compare against WHATSAPP_VERIFY_TOKEN from environment.
    2. If mode is 'subscribe' and token matches, return 'hub.challenge' as raw plain text with HTTP 200.
    3. If invalid or mismatched, return HTTP 403 Forbidden.
    """
    mode = request.query_params.get("hub.mode")
    verify_token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    configured_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "").strip()

    if mode == "subscribe" and verify_token and configured_token and verify_token == configured_token:
        logging.info("[WhatsApp Webhook] Verification successful for Meta challenge.")
        # Crucial: Meta expects the raw challenge string as plain text with 200 OK
        return Response(content=str(challenge), media_type="text/plain", status_code=200)

    logging.warning(
        f"[WhatsApp Webhook] Verification failed. Received mode={mode}, "
        f"match={verify_token == configured_token if configured_token else 'Token Not Configured'}"
    )
    return Response(content="Verification failed", media_type="text/plain", status_code=403)


@api_router.post("/whatsapp/webhook")
async def receive_whatsapp_webhook(
    request: Request,
    manager: BaseDataManager = Depends(get_data_manager)
):
    """
    Meta WhatsApp Cloud API Event Ingestion.
    Receives incoming webhook events:
      - Message delivery statuses: 'sent', 'delivered', 'read', 'failed'
      - Incoming customer messages / replies
    
    Security & Reliability:
    - Validates X-Hub-Signature-256 HMAC-SHA256 signature if META_APP_SECRET is set.
    - Prevents duplicate processing via in-memory event deduplication.
    - Updates associated reservation with delivery status.
    - Never logs tokens or sensitive data.
    - Always responds HTTP 200 quickly to Meta to avoid webhook unsubscription.
    """
    raw_body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")

    # Optional signature validation using META_APP_SECRET
    if not verify_webhook_signature(raw_body, signature):
        logging.warning("[WhatsApp Webhook] Invalid X-Hub-Signature-256 signature rejected.")
        return Response(content="Invalid signature", media_type="text/plain", status_code=403)

    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception as e:
        logging.error(f"[WhatsApp Webhook] Malformed JSON payload: {e}")
        # Always return 200 to acknowledge Meta even if body is unparseable
        return JSONResponse(content={"status": "invalid_json"}, status_code=200)

    # Process statuses and messages safely
    try:
        results = await handle_whatsapp_webhook(payload, manager)
    except Exception as e:
        logging.error(f"[WhatsApp Webhook] Error processing payload: {e}", exc_info=True)
        results = {"error": str(e)}

    # Return fast 200 OK to Meta
    return JSONResponse(content={"status": "ok", "processed": results}, status_code=200)



# =============================================================================
# EVENTS ENDPOINTS
# =============================================================================

@api_router.get("/events")
async def get_events(manager: BaseDataManager = Depends(get_data_manager)):
    """Get all published events (public) - cached 5 min"""
    events = await manager._read("events")
    active = [e for e in events if e.get("status", "active") != "archived"]
    return JSONResponse(content=active, headers={"Cache-Control": "public, max-age=300, stale-while-revalidate=60"})

@api_router.post("/events/contact")
async def event_contact_request(request: dict, manager: BaseDataManager = Depends(get_data_manager)):
    """Submit a contact request for an event"""
    contact_entry = {
        "_id": str(uuid.uuid4()),
        "event_id": request.get("event_id", ""),
        "event_title": request.get("event_title", "General Inquiry"),
        "name": request.get("name", ""),
        "phone": request.get("phone", ""),
        "email": request.get("email", ""),
        "message": request.get("message", ""),
        "guests": request.get("guests", 1),
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    contacts = await manager._read("event_contacts")
    contacts.append(contact_entry)
    await manager._write("event_contacts", contacts)
    return {"success": True, "message": "Your inquiry has been received! We will contact you shortly."}

@admin_router.get("/events")
async def admin_get_events(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Admin: Get all events"""
    return await manager._read("events")

@admin_router.post("/events")
async def admin_create_event(event_data: dict, username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Admin: Create a new event"""
    event = {
        "_id": str(uuid.uuid4()),
        "title": event_data.get("title", ""),
        "description": event_data.get("description", ""),
        "date": event_data.get("date", ""),
        "time": event_data.get("time", ""),
        "venue": event_data.get("venue", "Persian Darbar, Camp Pune"),
        "image": event_data.get("image", ""),
        "category": event_data.get("category", "Special Event"),
        "status": event_data.get("status", "active"),
        "max_guests": event_data.get("max_guests", 0),
        "price": event_data.get("price", ""),
        "highlights": event_data.get("highlights", []),
        "created_at": datetime.now().isoformat()
    }
    events = await manager._read("events")
    events.append(event)
    await manager._write("events", events)
    return event

@admin_router.put("/events/{event_id}")
async def admin_update_event(event_id: str, event_data: dict, username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Admin: Update an event"""
    events = await manager._read("events")
    for i, e in enumerate(events):
        if e.get("_id") == event_id:
            events[i] = {**e, **event_data, "_id": event_id}
            await manager._write("events", events)
            return events[i]
    raise HTTPException(status_code=404, detail="Event not found")

@admin_router.delete("/events/{event_id}")
async def admin_delete_event(event_id: str, username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Admin: Delete an event"""
    events = await manager._read("events")
    events = [e for e in events if e.get("_id") != event_id]
    await manager._write("events", events)
    return {"success": True}

@admin_router.get("/events/contacts")
async def admin_get_event_contacts(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Admin: Get all event contact requests"""
    return await manager._read("event_contacts")

@admin_router.put("/events/contacts/{contact_id}")
async def admin_update_event_contact(contact_id: str, update_data: dict, username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Admin: Update event contact status"""
    contacts = await manager._read("event_contacts")
    for i, c in enumerate(contacts):
        if c.get("_id") == contact_id:
            contacts[i] = {**c, **update_data}
            await manager._write("event_contacts", contacts)
            return contacts[i]
    raise HTTPException(status_code=404, detail="Contact not found")

# Chatbot Endpoint
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_vijay(message: ChatMessage):
    """Chat with Vijay - the virtual manager"""
    try:
        from openai import OpenAI
        
        openai_api_key = os.environ.get('OPENAI_API_KEY')
        if not openai_api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        client_openai = OpenAI(api_key=openai_api_key)
        
        system_prompt = """You are Vijay, the friendly and warm virtual manager of Persian Darbar â€” a legendary chain of authentic Persian and Mughlai restaurants. You speak in a welcoming, professional tone with a touch of royal hospitality.

Restaurant Details:
- Name: Persian Darbar
- Branches: Bandra West (Mumbai), Andheri East (Mumbai), Kurla West (Mumbai), Camp (Pune)
- Flagship: Moray Mahal, Linking Road, Bandra West, Mumbai
- Pune Branch: Renaissance Business Centre, Camp, Pune, Maharashtra 411001
- Hours: 11:00 AM - 1:00 AM (Daily)
- Phone: +91 9594287868
- Website: persiandarbar.in
- Cuisine: Authentic Persian, Mughlai, North Indian, Tandoor, Biryani
- Menu Categories: Biryani, Kebabs, Mughlai, Starters, Main Course, Breads, Desserts, Beverages, Mocktails
- Signature Dishes: Chicken Biryani, Mutton Raan, Chicken Tandoori Mumtaz, Murgh Jalandhari Tikka, Paneer Tikka, Kunafa, Mutton Kabsa Rice, Hara Bhara Kebab
- Mocktails: Fresh non-alcoholic mocktails crafted with fruits and herbs
- Known for: Royal ambience, generous portions, family dining, late-night service

App Features (Persian Darbar RMS):
- Online Ordering at /order â€” minimum order Rs.250
- Delivery: FREE within 5 km. Rs.60 flat fee for 5-20 km. Not available beyond 20 km
- Table Booking at /reservation â€” book by date, time, and party size
- Full digital Menu at /menu with all categories including Mocktails
- Reviews page at /reviews â€” write and read customer reviews
- Gallery page at /gallery â€” view restaurant photos
- Events page at /events â€” special events, contact us to book
- Order Tracking â€” real-time tracking after placing order
- PD Coins Loyalty: Earn 10% cashback in PD Coins. Redeem up to 25% of order value on orders Rs.300+
- Payment: Cash on Delivery (COD) or Online payment
- WhatsApp Notifications: Order confirmation and delivery bill sent to customer WhatsApp
- Customer Login: Sign up to track orders, earn PD Coins, manage reservations

Guidelines:
- Always be warm, friendly and hospitable â€” like a true Darbar host
- Recommend signature dishes when asked about food
- Talk proudly about Persian Darbar's rich legacy and authentic flavors
- Keep responses concise (2-3 sentences max) but full of personality
- If asked about bookings/reservations, guide them to /reservation
- If asked about orders/delivery, guide them to /order
- If asked about the menu, guide them to /menu
- If asked about events, guide them to /events
- If asked about loyalty/coins, explain the PD Coins program
- Delivery charges: FREE within 5 km, Rs.60 for 5-20 km, not available beyond 20 km
- Don't make up prices or dishes â€” stick to what you know about Persian Darbar
- If you don't know something, politely say you'll connect them with the team
- Refer to yourself as "Vijay" â€” the virtual manager
- Use occasional food emojis to make the conversation lively
- Always end responses by mentioning: For more queries, contact us at 9594287868
"""
        
        response = client_openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message.message}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        return ChatResponse(response=response.choices[0].message.content)
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        return ChatResponse(response="I'm having trouble right now. Please call us at +91 9594287868 for assistance!")

# =============================================================================
# ADMIN ENDPOINTS
# =============================================================================

@admin_router.post("/login", response_model=TokenResponse)
async def admin_login(credentials: AdminLogin, manager: BaseDataManager = Depends(get_data_manager)):
    """Admin login"""
    admin = await manager.get_admin_user(credentials.username)
    
    if not admin or not verify_password(credentials.password, admin["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": admin["username"], "role": "admin"})
    return TokenResponse(access_token=access_token)

@admin_router.post("/change-password")
async def change_password(
    password_data: AdminPasswordChange,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Change admin password"""
    admin = await manager.get_admin_user(username)
    
    if not admin or not verify_password(password_data.old_password, admin["password"]):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    # Internal update for MockFirebase
    admins = await manager._read("admin_users")
    for a in admins:
        if a["username"] == username:
            a["password"] = get_password_hash(password_data.new_password)
            break
    await manager._write("admin_users", admins)
    
    return {"message": "Password changed successfully"}

# Admin Menu Management
@admin_router.get("/menu")
async def admin_get_menu(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get ALL menu items including unavailable ones (admin view)"""
    return await manager.get_all_menu_items()

@admin_router.post("/menu")
async def admin_create_menu_item(
    menu_item: MenuItemCreate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Create new menu item"""
    item_data = menu_item.dict()
    if menu_item.variants:
        item_data["variants"] = [v.dict() for v in menu_item.variants]
    if menu_item.addons:
        item_data["addons"] = [a.dict() for a in menu_item.addons]
    
    return await manager.create_menu_item(item_data)

@admin_router.put("/menu/{item_id}")
async def admin_update_menu_item(
    item_id: str,
    menu_item: MenuItemUpdate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Update menu item"""
    # Use dict(exclude_unset=True) so that available=False is NOT dropped
    update_data = {k: v for k, v in menu_item.dict().items() if v is not None or k == "available"}
    # Remove None values but KEEP False (available=False must be saved)
    update_data = {k: v for k, v in menu_item.dict(exclude_unset=True).items()}
    if "variants" in update_data:
        update_data["variants"] = [v.dict() if hasattr(v, 'dict') else v for v in update_data["variants"]]
    if "addons" in update_data:
        update_data["addons"] = [a.dict() if hasattr(a, 'dict') else a for a in update_data["addons"]]
    
    success = await manager.update_menu_item_full(item_id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    return await manager.get_menu_item(item_id)

@admin_router.put("/menu/{item_id}/toggle-availability")
async def admin_toggle_menu_availability(
    item_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Quick toggle: available â†” unavailable without full edit form"""
    item = await manager.get_menu_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    new_available = not item.get("available", True)
    await manager.update_menu_item_full(item_id, {"available": new_available})
    return {"available": new_available, "message": f"Item marked {'available' if new_available else 'unavailable'}"}

@admin_router.delete("/menu/{item_id}")
async def admin_delete_menu_item(
    item_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Delete menu item"""
    success = await manager.delete_menu_item(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted successfully"}

# Admin Gallery Management
@admin_router.get("/gallery")
async def admin_get_gallery(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all gallery images"""
    images = await manager.get_gallery()
    normalized = []
    for img in images:
        item = dict(img)
        url = item.get("image_url") or item.get("url") or ""
        item["image_url"] = url
        item["url"] = url
        if not item.get("category"):
            item["category"] = "Ambience"
        normalized.append(item)
    return normalized

@admin_router.post("/gallery")
async def admin_create_gallery_image(
    gallery_image: GalleryImageCreate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Add new gallery image"""
    image_data = gallery_image.dict()
    url = image_data.get("image_url") or image_data.get("url") or ""
    image_data["image_url"] = url
    image_data["url"] = url
    if not image_data.get("category"):
        image_data["category"] = "Ambience"
    return await manager.create_gallery_image(image_data)

@admin_router.delete("/gallery/{image_id}")
async def admin_delete_gallery_image(
    image_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Delete gallery image"""
    success = await manager.delete_gallery_image(image_id)
    if not success:
        raise HTTPException(status_code=404, detail="Gallery image not found")
    return {"message": "Gallery image deleted successfully"}

# Admin Orders Management
@admin_router.get("/orders")
async def admin_get_orders(
    status_filter: Optional[str] = None,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Get all orders with optional status filter"""
    return await manager.get_all_orders(status_filter)

@admin_router.get("/orders/new")
async def admin_get_new_orders_count(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get count of new orders"""
    orders = await manager._read("orders")
    count = len([o for o in orders if o.get("status") == "placed"])
    return {"new_orders": count}

@admin_router.delete("/orders/{order_id}")
async def admin_delete_order(order_id: str, username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Delete order (only delivered orders)"""
    # Internal delete since we don't have a high-level one
    orders = await manager._read("orders")
    new_orders = [o for o in orders if not (o.get("order_id") == order_id and o.get("status") == "delivered")]
    if len(new_orders) == len(orders):
        raise HTTPException(status_code=404, detail="Order not found or not delivered")
    await manager._write("orders", new_orders)
    return {"message": "Order deleted successfully"}

@admin_router.put("/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Update order status"""
    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    now = datetime.utcnow()
    status_entry = {
        "status": status_update.status,
        "timestamp": now.isoformat(),
        "note": ""
    }
    
    if status_update.reason:
        status_entry["note"] = status_update.reason
    
    update_data = {
        "status": status_update.status,
        "updated_at": now.isoformat()
    }
    
    if status_update.status == "rejected" and status_update.reason:
        update_data["rejection_reason"] = status_update.reason
        status_entry["note"] = f"Order rejected: {status_update.reason}"
        if order.get("table_number"):
            await manager.update_table_status(order.get("table_number"), "free")
    
    if status_update.delay_time:
        update_data["delay_time"] = status_update.delay_time
        update_data["estimated_delivery_time"] = (now + timedelta(minutes=status_update.delay_time)).isoformat()
        status_entry["note"] = f"Order delayed by {status_update.delay_time} minutes"
    
    if status_update.status == "accepted":
        update_data["accepted_at"] = now.isoformat()
        kot_num = generate_kot_number()
        update_data["kot_number"] = kot_num
        if order.get("order_type") != "DINE_IN":
            # Assign monthly bill number for online orders (if not already set)
            if not order.get("bill_number"):
                bill_number, year_month = await generate_bill_number(manager)
                update_data["bill_number"] = bill_number
                update_data["bill_year_month"] = year_month
                order["bill_number"] = bill_number
                order["bill_year_month"] = year_month
            invoice_url = await create_order_invoice(order_id, manager)
            if invoice_url:
                update_data["invoice_url"] = invoice_url
        status_entry["note"] = f"Order accepted - KOT#{kot_num} generated"

        # Dispatch clean transactional WhatsApp Order Confirmation to customer (strictly online orders, NOT for dine-in KOT)
        if order.get("order_type") != "DINE_IN":
            try:
                order_for_wa = {**order, **update_data}
                wa_res = await send_order_confirmation(order_for_wa)
                if wa_res.get("success"):
                    update_data["whatsapp_order_sent"] = True
                    update_data["whatsapp_order_id"] = wa_res.get("message_id")
                    logging.info(f"[WhatsApp] Online order confirmation dispatched for order {order_id} (wamid: {wa_res.get('message_id')})")
                else:
                    update_data["whatsapp_order_error"] = wa_res.get("error")
                    logging.info(f"[WhatsApp] Online order confirmation notice for order {order_id}: {wa_res.get('error')}")
            except Exception as wa_err:
                logging.warning(f"[WhatsApp] Error dispatching order confirmation: {wa_err}")
    
    if status_update.status == "delivered":
        update_data["payment_status"] = "paid"
        status_entry["note"] = "Order delivered successfully"
        if order.get("table_number"):
            await manager.update_table_status(order.get("table_number"), "free")
        
        # Dispatch clean transactional WhatsApp Bill to customer (strictly online orders)
        if order.get("order_type") != "DINE_IN":
            try:
                # Ensure monthly sequential bill number and invoice exist
                if not order.get("bill_number"):
                    bill_number, year_month = await generate_bill_number(manager)
                    update_data["bill_number"] = bill_number
                    update_data["bill_year_month"] = year_month
                    order["bill_number"] = bill_number
                    order["bill_year_month"] = year_month
                invoice_url = await create_order_invoice(order_id, manager)
                if invoice_url:
                    update_data["invoice_url"] = invoice_url
                    order["invoice_url"] = invoice_url

                order_for_bill = {**order, **update_data}
                bill_res = await send_order_delivered_bill(order_for_bill)
                if bill_res.get("success"):
                    update_data["whatsapp_bill_sent"] = True
                    update_data["whatsapp_bill_id"] = bill_res.get("message_id")
                    logging.info(f"[WhatsApp] Delivered bill sent for order {order_id} (wamid: {bill_res.get('message_id')})")
                else:
                    update_data["whatsapp_bill_error"] = bill_res.get("error")
                    logging.info(f"[WhatsApp] Delivered bill notice for order {order_id}: {bill_res.get('error')}")
            except Exception as bill_err:
                logging.warning(f"[WhatsApp] Error sending delivered bill: {bill_err}")
    
    history = order.get("status_history", [])
    history.append(status_entry)
    update_data["status_history"] = history
    
    await manager.update_order(order_id, update_data)
    
    return await manager.get_order_by_id(order_id)

@admin_router.post("/orders/{order_id}/send-whatsapp")
async def admin_send_order_whatsapp(
    order_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """
    Manually dispatch or re-send WhatsApp order confirmation to customer
    using Meta WhatsApp Cloud API (clean format without emojis).
    """
    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    wa_res = await send_order_confirmation(order)
    if wa_res.get("success"):
        await manager.update_order(order_id, {
            "whatsapp_order_sent": True,
            "whatsapp_order_id": wa_res.get("message_id"),
            "whatsapp_order_sent_at": get_ist_now().isoformat()
        })
        return {
            "success": True,
            "message": "WhatsApp order confirmation dispatched successfully",
            "message_id": wa_res.get("message_id")
        }
    else:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": wa_res.get("error"),
                "details": wa_res.get("data")
            }
        )

@admin_router.post("/orders/{order_id}/assign-delivery")
async def admin_assign_delivery_partner(
    order_id: str,
    assignment: OrderAssignment,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Assign a delivery partner to an order"""
    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check partner existence (no specific method, so read internal)
    partners = await manager._read("delivery_partners")
    partner = next((p for p in partners if p.get("id") == assignment.delivery_partner_id or p.get("_id") == assignment.delivery_partner_id), None)
    
    if not partner:
        raise HTTPException(status_code=404, detail="Delivery partner not found")
    
    now = datetime.utcnow()
    history = order.get("status_history", [])
    history.append({
        "status": order.get("status"),
        "timestamp": now.isoformat(),
        "note": f"Delivery partner {partner.get('name')} assigned"
    })
    
    vehicle_info = f"{partner.get('vehicle_type', 'Bike')}"
    if partner.get("vehicle_number"):
        vehicle_info += f" ({partner.get('vehicle_number')})"

    await manager.update_order(order_id, {
        "delivery_partner_id": assignment.delivery_partner_id,
        "delivery_partner_name": partner.get("name"),
        "delivery_partner_phone": partner.get("phone"),
        "delivery_partner_vehicle": vehicle_info,
        "delivery_fleet": "Persian Darbar Private Fleet",
        "status_history": history
    })
    
    # Update partner internal
    current_orders = partner.get("current_orders", [])
    if order_id not in current_orders:
        current_orders.append(order_id)
    for p in partners:
        if p.get("id") == assignment.delivery_partner_id or p.get("_id") == assignment.delivery_partner_id:
            p["current_orders"] = current_orders
            break
    await manager._write("delivery_partners", partners)
    
    return await manager.get_order_by_id(order_id)

@admin_router.post("/orders/{order_id}/unassign-delivery")
async def admin_unassign_delivery_partner(
    order_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Unassign delivery partner from an order"""
    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_partner_id = order.get("delivery_partner_id")
    if old_partner_id:
        partners = await manager._read("delivery_partners")
        for p in partners:
            if p.get("id") == old_partner_id or p.get("_id") == old_partner_id:
                curr = p.get("current_orders", [])
                p["current_orders"] = [o for o in curr if o != order_id]
                break
        await manager._write("delivery_partners", partners)

    now = datetime.utcnow()
    history = order.get("status_history", [])
    history.append({
        "status": order.get("status"),
        "timestamp": now.isoformat(),
        "note": "Delivery partner unassigned"
    })

    await manager.update_order(order_id, {
        "delivery_partner_id": None,
        "delivery_partner_name": None,
        "delivery_partner_phone": None,
        "delivery_partner_vehicle": None,
        "delivery_fleet": None,
        "status_history": history
    })
    return await manager.get_order_by_id(order_id)

# =============================================================================
# PORTER DELIVERY INTEGRATION ENDPOINTS
# =============================================================================

@admin_router.post("/orders/{order_id}/porter/quote")
async def admin_porter_quote(
    order_id: str,
    body: PorterBookRequest,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """
    Get a Porter delivery quote (fare estimate + ETA) for a DELIVERY order.
    Admin calls this before confirming the Porter booking.
    """
    from porter_service import get_porter_quote, is_porter_configured

    if not is_porter_configured():
        raise HTTPException(
            status_code=503,
            detail="Porter is not configured. Please set PORTER_API_KEY in backend/.env"
        )

    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("order_type") != "DELIVERY":
        raise HTTPException(status_code=400, detail="Porter only applies to DELIVERY orders")
    if order.get("porter_order_id"):
        raise HTTPException(status_code=400, detail="Porter already booked for this order")

    result = await get_porter_quote(
        drop_lat=body.drop_lat,
        drop_lng=body.drop_lng,
        drop_address=order.get("address", ""),
        vehicle_type=body.vehicle_type,
    )

    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Porter quote failed"))

    return {
        "order_id":        order_id,
        "estimated_fare":  result["estimated_fare"],
        "eta_minutes":     result["eta_minutes"],
        "vehicle_type":    result["vehicle_type"],
        "porter_quote_id": result.get("porter_quote_id", ""),
        "distance_km":     order.get("distance_km"),
        "customer_name":   order.get("customer_name"),
        "address":         order.get("address"),
        "note": (
            "Free delivery for customer (<=10km). Porter cost is restaurant's expense."
            if (order.get("distance_km") or 0) <= 10
            else "Delivery fee of Rs60 charged to customer (10-20km)."
        )
    }


@admin_router.post("/orders/{order_id}/porter/book")
async def admin_porter_book(
    order_id: str,
    body: PorterBookRequest,
    request: Request,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """
    Book a Porter rider for a DELIVERY order.
    Admin triggers this from OrdersManagement after reviewing the quote.
    """
    from porter_service import create_porter_order, is_porter_configured

    if not is_porter_configured():
        raise HTTPException(
            status_code=503,
            detail="Porter is not configured. Please set PORTER_API_KEY in backend/.env"
        )

    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("order_type") != "DELIVERY":
        raise HTTPException(status_code=400, detail="Porter only applies to DELIVERY orders")
    if order.get("porter_order_id"):
        raise HTTPException(
            status_code=400,
            detail=f"Porter already booked: {order.get('porter_order_id')}"
        )
    if order.get("delivery_partner_id"):
        raise HTTPException(
            status_code=400,
            detail="An in-house rider is already assigned. Remove them first."
        )

    base_url = str(request.base_url).rstrip("/")
    webhook_url = f"{base_url}/api/porter/webhook"
    pm = "cash" if order.get("payment_method") == "cod" else "prepaid"

    result = await create_porter_order(
        rms_order_id=order_id,
        customer_name=order.get("customer_name", "Customer"),
        customer_phone=order.get("phone", ""),
        drop_lat=body.drop_lat,
        drop_lng=body.drop_lng,
        drop_address=order.get("address", ""),
        amount=order.get("total", 0.0),
        payment_method=pm,
        vehicle_type=body.vehicle_type,
        webhook_url=webhook_url,
    )

    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Porter booking failed"))

    now = get_ist_now()
    history = order.get("status_history", [])
    history.append({
        "status": order.get("status"),
        "timestamp": now.isoformat(),
        "note": f"Porter booked â€” ID: {result['porter_order_id']} | Rider: {result.get('rider_name') or 'Searching...'}"
    })

    porter_update = {
        "porter_order_id":     result["porter_order_id"],
        "porter_status":       result.get("status", "open"),
        "porter_tracking_url": result.get("tracking_url", ""),
        "porter_rider_name":   result.get("rider_name", ""),
        "porter_rider_phone":  result.get("rider_phone", ""),
        "porter_booked_at":    now.isoformat(),
        "status_history":      history,
        "updated_at":          now.isoformat(),
    }
    await manager.update_order(order_id, porter_update)
    logger.info(f"Porter booked for order {order_id}: porter_id={result['porter_order_id']}")

    return {
        "message":         "Porter rider booked successfully!",
        "porter_order_id": result["porter_order_id"],
        "tracking_url":    result.get("tracking_url", ""),
        "rider_name":      result.get("rider_name", "Searching for rider..."),
        "rider_phone":     result.get("rider_phone", ""),
        "eta_minutes":     result.get("estimated_pickup_eta", 0),
        "status":          result.get("status", "open"),
    }


@admin_router.post("/orders/{order_id}/porter/cancel")
async def admin_porter_cancel(
    order_id: str,
    body: PorterCancelRequest,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Cancel the Porter booking for an order (only before pickup)."""
    from porter_service import cancel_porter_order

    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    porter_order_id = order.get("porter_order_id")
    if not porter_order_id:
        raise HTTPException(status_code=400, detail="No Porter booking found for this order")

    if order.get("porter_status") in ("order_picked_up", "started_for_delivery", "delivered"):
        raise HTTPException(
            status_code=400,
            detail="Porter rider has already picked up the order â€” cannot cancel"
        )

    result = await cancel_porter_order(porter_order_id, body.reason)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Porter cancellation failed"))

    now = get_ist_now()
    history = order.get("status_history", [])
    history.append({
        "status": order.get("status"),
        "timestamp": now.isoformat(),
        "note": f"Porter booking cancelled â€” Reason: {body.reason}"
    })

    await manager.update_order(order_id, {
        "porter_order_id":     None,
        "porter_status":       "cancelled",
        "porter_tracking_url": None,
        "porter_rider_name":   None,
        "porter_rider_phone":  None,
        "status_history":      history,
        "updated_at":          now.isoformat(),
    })
    logger.info(f"Porter booking cancelled for order {order_id}")
    return {"message": "Porter booking cancelled. You can now assign an in-house rider."}


@admin_router.get("/orders/{order_id}/porter/status")
async def admin_porter_status(
    order_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Poll latest Porter status for an order and sync to RMS."""
    from porter_service import get_porter_order_status, map_porter_status_to_rms

    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    porter_order_id = order.get("porter_order_id")
    if not porter_order_id:
        raise HTTPException(status_code=400, detail="No Porter booking for this order")

    result = await get_porter_order_status(porter_order_id)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Porter status fetch failed"))

    now = get_ist_now()
    update_data = {
        "porter_status":       result["status"],
        "porter_tracking_url": result.get("tracking_url", order.get("porter_tracking_url", "")),
        "porter_rider_name":   result.get("rider_name", order.get("porter_rider_name", "")),
        "porter_rider_phone":  result.get("rider_phone", order.get("porter_rider_phone", "")),
        "updated_at":          now.isoformat(),
    }

    rms_status = map_porter_status_to_rms(result["status"])
    if rms_status and order.get("status") != rms_status:
        history = order.get("status_history", [])
        history.append({
            "status": rms_status,
            "timestamp": now.isoformat(),
            "note": f"Auto-synced from Porter status: {result['status']}"
        })
        update_data["status"] = rms_status
        update_data["status_history"] = history

    await manager.update_order(order_id, update_data)
    return {**result, "order_id": order_id, "synced_rms_status": rms_status}


@admin_router.get("/porter/config")
async def admin_porter_config(username: str = Depends(verify_token)):
    """Check Porter integration config status for the Settings page."""
    from porter_service import (
        is_porter_configured, PORTER_API_BASE, RESTAURANT_LAT,
        RESTAURANT_LNG, RESTAURANT_ADDRESS, RESTAURANT_NAME
    )
    return {
        "configured":         is_porter_configured(),
        "environment":        "sandbox" if "uat" in PORTER_API_BASE else "production",
        "api_base":           PORTER_API_BASE,
        "restaurant_name":    RESTAURANT_NAME,
        "restaurant_lat":     RESTAURANT_LAT,
        "restaurant_lng":     RESTAURANT_LNG,
        "restaurant_address": RESTAURANT_ADDRESS,
    }


# Porter Webhook â€” public endpoint, Porter POSTs updates here
@api_router.post("/porter/webhook")
async def porter_webhook(
    request: Request,
    manager: BaseDataManager = Depends(get_data_manager)
):
    """
    Receive Porter delivery status webhook updates.
    Porter POSTs here when rider status changes.
    Verified via X-Porter-Signature header.
    """
    from porter_service import verify_porter_webhook, map_porter_status_to_rms

    body = await request.body()
    signature = request.headers.get("X-Porter-Signature", "")

    if not verify_porter_webhook(body, signature):
        logger.warning("Porter webhook signature verification FAILED")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        import json as _json
        payload = _json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.info(f"Porter webhook received: {payload}")

    porter_order_id = payload.get("order_id") or payload.get("data", {}).get("order_id", "")
    porter_status   = payload.get("status")   or payload.get("data", {}).get("status", "")
    tracking_url    = payload.get("tracking_url") or payload.get("data", {}).get("tracking_url", "")
    rider_data      = payload.get("delivery_executive") or payload.get("data", {}).get("delivery_executive") or {}
    rider_name      = rider_data.get("name", "")
    rider_phone_raw = rider_data.get("mobile", {})
    rider_phone     = rider_phone_raw.get("number", "") if isinstance(rider_phone_raw, dict) else str(rider_phone_raw)

    if not porter_order_id or not porter_status:
        return {"received": True}

    all_orders = await manager._read("orders")
    target = next(
        (o for o in all_orders if o.get("porter_order_id") == porter_order_id),
        None
    )
    if not target:
        target = next(
            (o for o in all_orders if o.get("order_id") == porter_order_id),
            None
        )

    if not target:
        logger.warning(f"Porter webhook: no RMS order for porter_id={porter_order_id}")
        return {"received": True, "matched": False}

    rms_order_id = target.get("order_id")
    now = get_ist_now()
    update_data = {
        "porter_status":       porter_status,
        "porter_rider_name":   rider_name or target.get("porter_rider_name", ""),
        "porter_rider_phone":  rider_phone or target.get("porter_rider_phone", ""),
        "porter_tracking_url": tracking_url or target.get("porter_tracking_url", ""),
        "updated_at":          now.isoformat(),
    }

    rms_status = map_porter_status_to_rms(porter_status)
    if rms_status and target.get("status") != rms_status:
        history = target.get("status_history", [])
        history.append({
            "status":    rms_status,
            "timestamp": now.isoformat(),
            "note":      f"Porter: {porter_status} | Rider: {rider_name or 'N/A'}"
        })
        update_data["status"] = rms_status
        update_data["status_history"] = history
        logger.info(f"Order {rms_order_id} updated to '{rms_status}' via Porter webhook")

    await manager.update_order(rms_order_id, update_data)
    return {"received": True, "matched": True, "rms_order_id": rms_order_id}


# Invoice Download Endpoints
@admin_router.get("/invoice/{order_id}")
async def download_invoice(
    order_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Download invoice PDF - always re-generates fresh to ensure logo, Rs., and monthly bill number"""
    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    invoice_path = INVOICE_DIR / f"invoice_{order_id}.pdf"
    
    # Ensure bill number is present
    if not order.get("bill_number"):
        bill_number, year_month = await generate_bill_number(manager)
        order["bill_number"] = bill_number
        order["bill_year_month"] = year_month
        await manager.update_order(order_id, {"bill_number": bill_number, "bill_year_month": year_month})
        
    try:
        generate_invoice_pdf(order, str(invoice_path))
    except Exception as e:
        logger.error(f"Invoice generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Invoice generation failed: {str(e)}")
    
    bill_no = order.get("bill_number", order_id)
    return FileResponse(
        path=str(invoice_path),
        filename=f"invoice_{bill_no}.pdf",
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=invoice_{bill_no}.pdf"}
    )


@api_router.get("/invoice/{order_id}")
@api_router.get("/invoice/{order_id}.pdf")
@api_router.get("/orders/{order_id}/invoice")
@api_router.get("/orders/{order_id}/invoice.pdf")
async def customer_download_invoice(
    order_id: str,
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Public customer download endpoint for order invoice PDF"""
    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    invoice_path = INVOICE_DIR / f"invoice_{order_id}.pdf"
    
    if not order.get("bill_number"):
        bill_number, year_month = await generate_bill_number(manager)
        order["bill_number"] = bill_number
        order["bill_year_month"] = year_month
        await manager.update_order(order_id, {"bill_number": bill_number, "bill_year_month": year_month})
        
    try:
        generate_invoice_pdf(order, str(invoice_path))
    except Exception as e:
        logger.error(f"Customer invoice generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Invoice generation failed: {str(e)}")
    
    bill_no = order.get("bill_number", order_id)
    return FileResponse(
        path=str(invoice_path),
        filename=f"Persian_Darbar_Invoice_{bill_no}.pdf",
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=Persian_Darbar_Invoice_{bill_no}.pdf"}
    )

# Admin File Upload Endpoints
@admin_router.post("/upload/image")
async def admin_upload_image(
    request: Request,
    file: UploadFile = File(...),
    username: str = Depends(verify_token)
):
    """Upload image to Firebase Storage (permanent, survives server restarts)"""
    try:
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed."
            )

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        file_extension = file.filename.split(".")[-1].lower()
        filename = f"menu_images/img_{timestamp}_{random_suffix}.{file_extension}"

        file_contents = await file.read()

        # Try Firebase Storage first
        try:
            from firebase_admin import storage as fb_storage
            import firebase_admin

            # Initialize storage bucket
            bucket_name = os.environ.get("FIREBASE_STORAGE_BUCKET", "tasteofhindustanrms.firebasestorage.app")
            bucket = fb_storage.bucket(bucket_name)
            blob = bucket.blob(filename)
            blob.upload_from_string(file_contents, content_type=file.content_type)
            blob.make_public()
            image_url = blob.public_url
            logger.info(f"Image uploaded to Firebase Storage: {image_url}")
            return {"success": True, "url": image_url, "filename": filename, "storage": "firebase"}

        except Exception as firebase_err:
            logger.warning(f"Firebase Storage failed, falling back to local: {firebase_err}")
            # Fallback: save to local disk
            local_filename = f"img_{timestamp}_{random_suffix}.{file_extension}"
            file_path = UPLOAD_DIR / local_filename
            with open(file_path, "wb") as buffer:
                buffer.write(file_contents)
            # Return relative path - frontend will prepend API_BASE if needed
            image_url = f"/static/uploads/{local_filename}"
            return {"success": True, "url": image_url, "filename": local_filename, "storage": "local"}

    except Exception as e:
        logger.error(f"Image upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    finally:
        file.file.close()


@admin_router.post("/upload/sound")
async def admin_upload_notification_sound(
    file: UploadFile = File(...),
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Upload custom notification sound"""
    try:
        allowed_types = [
            "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave",
            "audio/ogg", "audio/webm", "video/webm", "audio/mp4", "audio/x-m4a",
            "audio/aac", "application/octet-stream"
        ]
        file_extension = file.filename.split(".")[-1].lower() if "." in (file.filename or "") else "mp3"
        allowed_exts = ["mp3", "wav", "ogg", "webm", "m4a", "aac", "opus"]
        
        content_type = (file.content_type or "").lower()
        is_audio = content_type.startswith("audio/") or content_type in allowed_types or file_extension in allowed_exts
        if not is_audio:
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an MP3, WAV, OGG, or WebM audio file.")
        
        sounds_dir = ROOT_DIR / "static" / "sounds"
        sounds_dir.mkdir(parents=True, exist_ok=True)
        
        ext = file_extension if file_extension in allowed_exts else "mp3"
        timestamp = int(datetime.now().timestamp())
        filename = f"notification_{timestamp}.{ext}"
        
        file_path = sounds_dir / filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        sound_url = f"/static/sounds/{filename}"
        await manager.update_setting("notification_sound", sound_url)
        return {"success": True, "url": sound_url, "message": "Notification sound updated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sound upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    finally:
        file.file.close()

@admin_router.get("/notification-sound")
async def get_notification_sound(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get current notification sound URL"""
    val = await manager.get_setting("notification_sound")
    return {"url": val}

@admin_router.get("/notification-sound/dinein")
async def get_dinein_notification_sound(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get dine-in notification sound URL"""
    val = await manager.get_setting("notification_sound_dinein")
    return {"url": val}

@admin_router.post("/upload/sound/dinein")
async def admin_upload_dinein_notification_sound(
    file: UploadFile = File(...),
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Upload custom dine-in notification sound"""
    try:
        allowed_types = [
            "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave",
            "audio/ogg", "audio/webm", "video/webm", "audio/mp4", "audio/x-m4a",
            "audio/aac", "application/octet-stream"
        ]
        file_extension = file.filename.split(".")[-1].lower() if "." in (file.filename or "") else "mp3"
        allowed_exts = ["mp3", "wav", "ogg", "webm", "m4a", "aac", "opus"]
        
        content_type = (file.content_type or "").lower()
        is_audio = content_type.startswith("audio/") or content_type in allowed_types or file_extension in allowed_exts
        if not is_audio:
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an MP3, WAV, OGG, or WebM audio file.")
        
        sounds_dir = ROOT_DIR / "static" / "sounds"
        sounds_dir.mkdir(parents=True, exist_ok=True)
        
        ext = file_extension if file_extension in allowed_exts else "mp3"
        timestamp = int(datetime.now().timestamp())
        filename = f"notification_dinein_{timestamp}.{ext}"
        
        file_path = sounds_dir / filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        sound_url = f"/static/sounds/{filename}"
        await manager.update_setting("notification_sound_dinein", sound_url)
        return {"success": True, "url": sound_url, "message": "Dine-in notification sound updated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sound upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    finally:
        file.file.close()
        



# Admin Reservations Management
@admin_router.get("/reservations")
async def admin_get_reservations(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all reservations"""
    reservations = await manager._read("reservations")
    return sorted(reservations, key=lambda x: x.get("created_at", ""), reverse=True)

@admin_router.put("/reservations/{reservation_id}/status")
async def admin_update_reservation_status(
    reservation_id: str,
    status_update: ReservationStatusUpdate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Update reservation status"""
    reservations = await manager._read("reservations")
    updated = False
    target_res = None
    for r in reservations:
        if r.get("id") == reservation_id or r.get("_id") == reservation_id:
            r["status"] = status_update.status
            if status_update.table_number is not None:
                r["table_number"] = status_update.table_number
            if status_update.whatsapp_sent is not None:
                r["whatsapp_sent"] = status_update.whatsapp_sent
            r["updated_at"] = get_ist_now().isoformat()
            updated = True
            target_res = r
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    await manager._write("reservations", reservations)

    # If confirmed today and has table_number, ensure table is marked reserved if currently free
    if status_update.status == "confirmed" and target_res.get("table_number"):
        try:
            today_str = get_ist_now().strftime("%Y-%m-%d")
            if target_res.get("date") == today_str:
                tables = await manager.get_tables()
                t_modified = False
                for t in tables:
                    if t.get("table_number") == target_res["table_number"]:
                        if t.get("status") == "free":
                            t["status"] = "reserved"
                            t_modified = True
                        break
                if t_modified:
                    await manager._write("tables", tables)
        except Exception:
            pass

    # Automatically dispatch WhatsApp confirmation via Meta Cloud API if status is confirmed
    if status_update.status == "confirmed":
        try:
            wa_res = await send_reservation_confirmation(target_res)
            if wa_res.get("success"):
                target_res["whatsapp_sent"] = True
                target_res["whatsapp_message_id"] = wa_res.get("message_id")
                target_res["whatsapp_status"] = "sent"
                target_res["whatsapp_sent_at"] = get_ist_now().isoformat()
                await manager._write("reservations", reservations)
                logging.info(f"[WhatsApp] Auto-confirmation dispatched for reservation {reservation_id} (wamid: {wa_res.get('message_id')})")
            else:
                target_res["whatsapp_error"] = wa_res.get("error")
                await manager._write("reservations", reservations)
                logging.info(f"[WhatsApp] Auto-confirmation notice: {wa_res.get('error')}")
        except Exception as wa_err:
            logging.warning(f"[WhatsApp] Error dispatching auto-confirmation: {wa_err}")

    return {"message": "Reservation status updated", "reservation": target_res}

@admin_router.post("/reservations/{reservation_id}/send-whatsapp")
async def admin_send_reservation_whatsapp(
    reservation_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """
    Manually dispatch or re-send WhatsApp confirmation for a reservation
    using Meta WhatsApp Cloud API.
    """
    reservations = await manager._read("reservations")
    target_res = next((r for r in reservations if r.get("id") == reservation_id or r.get("_id") == reservation_id), None)
    if not target_res:
        raise HTTPException(status_code=404, detail="Reservation not found")

    wa_res = await send_reservation_confirmation(target_res)
    if wa_res.get("success"):
        target_res["whatsapp_sent"] = True
        target_res["whatsapp_message_id"] = wa_res.get("message_id")
        target_res["whatsapp_status"] = "sent"
        target_res["whatsapp_sent_at"] = get_ist_now().isoformat()
        await manager._write("reservations", reservations)
        return {
            "success": True,
            "message": "WhatsApp confirmation dispatched successfully",
            "message_id": wa_res.get("message_id")
        }
    else:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": wa_res.get("error"),
                "details": wa_res.get("data")
            }
        )

@admin_router.post("/whatsapp/test-send")
async def admin_whatsapp_test_send(
    phone: str,
    message: Optional[str] = None,
    username: str = Depends(verify_token)
):
    """
    Admin diagnostic endpoint to verify Meta credentials and connectivity
    by sending a test text message.
    """
    msg = message or "🧪 Persian Darbar: Meta WhatsApp Cloud API connection test successful!"
    res = await send_whatsapp_text_message(to_phone=phone, message_text=msg)
    if res.get("success"):
        return {"success": True, "message_id": res.get("message_id")}
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": res.get("error"), "data": res.get("data")}
    )

@admin_router.delete("/reservations/{reservation_id}")
async def admin_delete_reservation(
    reservation_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Delete a reservation"""
    reservations = await manager._read("reservations")
    new_list = [r for r in reservations if r.get("id") != reservation_id and r.get("_id") != reservation_id]
    if len(new_list) == len(reservations):
        raise HTTPException(status_code=404, detail="Reservation not found")
    await manager._write("reservations", new_list)
    return {"message": "Reservation deleted"}

# Admin Reviews Management
@admin_router.get("/reviews")
async def admin_get_reviews(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all reviews (including pending ones for admin)"""
    reviews = await manager._read("reviews")
    return sorted(reviews, key=lambda x: x.get("created_at", ""), reverse=True)

@admin_router.post("/reviews")
async def admin_create_review(
    review_data: dict,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Admin creates a pre-approved review from an external platform (Google Maps, Zomato, Swiggy)"""
    name = str(review_data.get("name", "")).strip()
    text = str(review_data.get("text", "")).strip()
    rating = int(review_data.get("rating", 5))
    source = str(review_data.get("source", "website")).strip()  # google | zomato | swiggy | website
    date_str = review_data.get("date", datetime.utcnow().isoformat())

    if not name:
        raise HTTPException(status_code=400, detail="Reviewer name is required")
    if not text or len(text) < 5:
        raise HTTPException(status_code=400, detail="Review text must be at least 5 characters")
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    review = {
        "_id": str(uuid.uuid4()),
        "name": name,
        "text": text,
        "rating": rating,
        "source": source,
        "date": date_str,
        "created_at": datetime.utcnow().isoformat(),
        "pending": True,   # Requires admin approval before going live
        "admin_added": True,
    }

    reviews = await manager._read("reviews")
    reviews.append(review)
    await manager._write("reviews", reviews)
    return {"message": "Review added successfully", "id": review["_id"]}

@admin_router.post("/reviews/{review_id}/approve")
async def admin_approve_review(
    review_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Approve a pending review â€” makes it visible on the public site"""
    reviews = await manager._read("reviews")
    updated = False
    for r in reviews:
        if r.get("_id") == review_id or r.get("id") == review_id:
            r["pending"] = False
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail="Review not found")
    await manager._write("reviews", reviews)
    return {"message": "Review approved"}

@admin_router.delete("/reviews/{review_id}")
async def admin_delete_review(
    review_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Delete review"""
    reviews = await manager._read("reviews")
    new_reviews = [r for r in reviews if r.get("id") != review_id and r.get("_id") != review_id]
    if len(new_reviews) == len(reviews):
        raise HTTPException(status_code=404, detail="Review not found")
    await manager._write("reviews", new_reviews)
    return {"message": "Review deleted successfully"}

# =============================================================================
# INVENTORY MANAGEMENT ENDPOINTS
# =============================================================================

@admin_router.get("/inventory")
async def admin_get_inventory(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all inventory items"""
    # Using read internal for now as we didn't add inventory to BaseDataManager yet
    return await manager._read("inventory")

@admin_router.post("/inventory")
async def admin_add_inventory(item: dict, username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Add new inventory item"""
    return await manager.create_inventory_item(item)

@admin_router.patch("/inventory/{item_id}/stock")
async def admin_update_stock(item_id: str, data: dict, username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Update inventory stock level"""
    item = await manager.get_inventory_item(item_id)
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    change = data.get("change", 0)
    reason = data.get("reason", "Manual adjustment")
    new_stock = max(0, (item.get("current_stock", 0)) + change)
    
    history = item.get("history", [])
    history.append({
        "change": change,
        "reason": reason,
        "timestamp": datetime.utcnow().isoformat(),
        "new_stock": new_stock
    })
    
    await manager.update_inventory_item(item_id, {
        "current_stock": new_stock,
        "history": history
    })
    
    return {"message": "Stock updated", "new_stock": new_stock}

@admin_router.delete("/inventory/{item_id}")
async def admin_delete_inventory(item_id: str, username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Delete inventory item"""
    # Using internal _read/_write since we didn't add delete to BaseDataManager yet
    inventory = await manager._read("inventory")
    new_inventory = [i for i in inventory if i.get("_id") != item_id and i.get("id") != item_id]
    if len(new_inventory) == len(inventory):
        raise HTTPException(status_code=404, detail="Item not found")
    await manager._write("inventory", new_inventory)
    return {"message": "Item deleted"}

@admin_router.get("/inventory/{item_id}/history")
async def admin_get_inventory_history(item_id: str, username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get stock history for an item"""
    item = await manager.get_inventory_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return (item.get("history", []))[-20:]

# Admin Coupons Management
@admin_router.get("/coupons")
async def admin_get_coupons(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all coupons"""
    return await manager._read("coupons")

@admin_router.post("/coupons")
async def admin_create_coupon(
    coupon: CouponCreate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Create new coupon"""
    coupons = await manager._read("coupons")
    if any(c.get("code") == coupon.code.upper() for c in coupons):
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    new_coupon = {
        "id": str(uuid.uuid4()),
        "code": coupon.code.upper(),
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "min_order_value": coupon.min_order_value,
        "max_discount": coupon.max_discount,
        "valid_from": coupon.valid_from.isoformat() if hasattr(coupon.valid_from, 'isoformat') else coupon.valid_from,
        "valid_until": coupon.valid_until.isoformat() if hasattr(coupon.valid_until, 'isoformat') else coupon.valid_until,
        "usage_limit": coupon.usage_limit,
        "active": coupon.active,
        "used_count": 0,
        "created_at": datetime.utcnow().isoformat()
    }
    
    coupons.append(new_coupon)
    await manager._write("coupons", coupons)
    return new_coupon

@admin_router.put("/coupons/{coupon_id}")
async def admin_update_coupon(
    coupon_id: str,
    coupon_update: CouponUpdate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Update coupon"""
    coupons = await manager._read("coupons")
    coupon = None
    for c in coupons:
        if c.get("id") == coupon_id or c.get("_id") == coupon_id:
            coupon = c
            break
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    update_data = {k: v for k, v in coupon_update.dict().items() if v is not None}
    for key, value in update_data.items():
        if hasattr(value, 'isoformat'):
            coupon[key] = value.isoformat()
        else:
            coupon[key] = value
    
    await manager._write("coupons", coupons)
    return coupon

@admin_router.delete("/coupons/{coupon_id}")
async def admin_delete_coupon(
    coupon_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Delete coupon"""
    coupons = await manager._read("coupons")
    new_coupons = [c for c in coupons if c.get("id") != coupon_id and c.get("_id") != coupon_id]
    if len(new_coupons) == len(coupons):
        raise HTTPException(status_code=404, detail="Coupon not found")
    await manager._write("coupons", new_coupons)
    return {"message": "Coupon deleted successfully"}

# Admin Rider Performance Stats
@admin_router.get("/delivery-stats")
async def admin_get_delivery_stats(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get per-rider delivery performance stats: count of delivered orders and total value delivered."""
    orders = await manager._read("orders")
    partners = await manager._read("delivery_partners")

    # Build a lookup of partner id -> name
    partner_map = {}
    for p in partners:
        pid = p.get("id") or p.get("_id")
        if pid:
            partner_map[str(pid)] = p.get("name", "Unknown Rider")

    # Group delivered orders by rider
    stats = {}
    for o in orders:
        if o.get("status") != "delivered":
            continue
        rider_id = str(o.get("delivery_partner_id") or o.get("assigned_rider_id") or "")
        rider_name = o.get("delivery_partner_name") or partner_map.get(rider_id) or "Unassigned"
        if not rider_id:
            rider_id = "unassigned"
            rider_name = "Unassigned"
        if rider_id not in stats:
            stats[rider_id] = {
                "rider_id": rider_id,
                "rider_name": rider_name,
                "deliveries": 0,
                "total_value": 0.0,
                "last_delivered": None
            }
        stats[rider_id]["deliveries"] += 1
        stats[rider_id]["total_value"] += float(o.get("total") or 0)
        delivered_at = o.get("updated_at") or o.get("created_at")
        if delivered_at:
            if not stats[rider_id]["last_delivered"] or delivered_at > stats[rider_id]["last_delivered"]:
                stats[rider_id]["last_delivered"] = delivered_at

    return sorted(stats.values(), key=lambda x: x["deliveries"], reverse=True)

# Admin Delivery Partners Management
@admin_router.get("/delivery-partners")
async def admin_get_delivery_partners(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all delivery partners"""
    partners = await manager._read("delivery_partners")
    return [{**p, "password": ""} for p in partners]

@admin_router.post("/delivery-partners")
async def admin_create_delivery_partner(
    partner: DeliveryPartnerCreate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Create new delivery partner"""
    partners = await manager._read("delivery_partners")
    if any(p.get("phone") == partner.phone for p in partners):
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    new_partner = {
        "id": str(uuid.uuid4()),
        "name": partner.name,
        "phone": partner.phone,
        "email": partner.email,
        "vehicle_type": partner.vehicle_type,
        "vehicle_number": partner.vehicle_number,
        "password": get_password_hash(partner.password),
        "active": True,
        "current_orders": [],
        "total_deliveries": 0,
        "rating": 5.0,
        "created_at": datetime.utcnow().isoformat()
    }
    
    partners.append(new_partner)
    await manager._write("delivery_partners", partners)
    return {**new_partner, "password": ""}

@admin_router.put("/delivery-partners/{partner_id}")
async def admin_update_delivery_partner(
    partner_id: str,
    partner_update: DeliveryPartnerUpdate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Update delivery partner"""
    partners = await manager._read("delivery_partners")
    partner = None
    for p in partners:
        if p.get("id") == partner_id or p.get("_id") == partner_id:
            partner = p
            break
    
    if not partner:
        raise HTTPException(status_code=404, detail="Delivery partner not found")
    
    update_data = {k: v for k, v in partner_update.dict().items() if v is not None}
    for key, value in update_data.items():
        partner[key] = value
    
    await manager._write("delivery_partners", partners)
    return {**partner, "password": ""}

@admin_router.delete("/delivery-partners/{partner_id}")
async def admin_delete_delivery_partner(
    partner_id: str,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Delete delivery partner"""
    partners = await manager._read("delivery_partners")
    new_partners = [p for p in partners if p.get("id") != partner_id and p.get("_id") != partner_id]
    if len(new_partners) == len(partners):
        raise HTTPException(status_code=404, detail="Delivery partner not found")
    await manager._write("delivery_partners", new_partners)
    return {"message": "Delivery partner deleted successfully"}

# Admin Analytics
@admin_router.get("/analytics/sales")
async def admin_get_sales_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Get sales analytics"""
    orders = await manager._read("orders") # Internal read
    
    if start_date:
        sd = datetime.fromisoformat(start_date)
        orders = [o for o in orders if datetime.fromisoformat(o["created_at"]) >= sd]
    if end_date:
        ed = datetime.fromisoformat(end_date)
        orders = [o for o in orders if datetime.fromisoformat(o["created_at"]) <= ed]
    
    total_sales = 0.0
    total_orders = len(orders)
    completed_orders = 0
    cancelled_orders = 0
    pending_orders = 0
    total_refunds = 0.0
    today_revenue = 0.0
    today_orders = 0
    
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    item_sales = {}
    
    for order in orders:
        created_at_val = order.get("created_at")
        if isinstance(created_at_val, str):
            created_at = datetime.fromisoformat(created_at_val)
        else:
            created_at = created_at_val
            
        status = order.get("status")
        total = order.get("total", 0)
        
        if status == "delivered":
            total_sales += total
            completed_orders += 1
            
            for item in order.get("items", []):
                item_name = item.get("name", "Unknown")
                if item_name not in item_sales:
                    item_sales[item_name] = {"name": item_name, "quantity": 0, "revenue": 0.0}
                qty = item.get("quantity", 0)
                price = item.get("price", 0)
                item_sales[item_name]["quantity"] += qty
                item_sales[item_name]["revenue"] += price * qty
        
        elif status == "cancelled":
            cancelled_orders += 1
            if order.get("payment_status") == "paid":
                total_refunds += total
        
        elif status in ["placed", "accepted", "preparing", "ready", "out_for_delivery"]:
            pending_orders += 1
        
        if created_at >= today_start:
            today_orders += 1
            if status == "delivered":
                today_revenue += total
    
    best_selling = sorted(item_sales.values(), key=lambda x: x["quantity"], reverse=True)[:10]
    
    revenue_by_date = []
    for i in range(7):
        date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
        next_date = date + timedelta(days=1)
        
        day_orders = []
        for o in orders:
            o_created_at = o.get("created_at")
            if isinstance(o_created_at, str):
                o_dt = datetime.fromisoformat(o_created_at)
            else:
                o_dt = o_created_at
            
            if date <= o_dt < next_date and o.get("status") == "delivered":
                day_orders.append(o)
                
        day_revenue = sum([o.get("total", 0) for o in day_orders])
        
        revenue_by_date.append({
            "date": date.strftime("%Y-%m-%d"),
            "revenue": day_revenue,
            "orders": len(day_orders)
        })
    
    revenue_by_date.reverse()
    
    return SalesAnalytics(
        total_sales=total_sales,
        total_orders=total_orders,
        completed_orders=completed_orders,
        cancelled_orders=cancelled_orders,
        pending_orders=pending_orders,
        total_refunds=total_refunds,
        today_revenue=today_revenue,
        today_orders=today_orders,
        best_selling_items=best_selling,
        revenue_by_date=revenue_by_date
    )

# =============================================================================
# ADMIN REPORTS ENDPOINTS
# =============================================================================

def _parse_order_dt(val):
    if not val:
        return None
    if isinstance(val, str):
        try:
            val = datetime.fromisoformat(val.replace("Z", "+00:00"))
        except Exception:
            return None
    if hasattr(val, "tzinfo") and val.tzinfo is not None:
        val = val.astimezone().replace(tzinfo=None)
    return val

@admin_router.get("/reports/daily")
async def admin_get_daily_report(
    date: str = None,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Get daily report for a specific date"""
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    
    try:
        report_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    start_of_day = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = report_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Fetch orders (internal read)
    all_orders = await manager._read("orders")
    
    orders = []
    for o in all_orders:
        created_at = _parse_order_dt(o.get("created_at"))
        if created_at and start_of_day <= created_at <= end_of_day:
            orders.append(o)
    
    # Calculate metrics
    total_sales = 0.0
    total_orders = len(orders)
    completed_orders = 0
    dine_in = 0
    delivery = 0
    takeaway = 0
    item_sales = {}
    hourly_stats = {}
    table_stats = {}
    
    for order in orders:
        status = order.get("status")
        total = order.get("total", 0)
        
        if status in ["delivered", "completed", "ready"]:
            total_sales += total
            completed_orders += 1
            
            # Track items
            for item in order.get("items", []):
                item_name = item.get("name", "Unknown")
                if item_name not in item_sales:
                    item_sales[item_name] = {"name": item_name, "quantity": 0, "revenue": 0.0}
                qty = item.get("quantity", 1)
                item_sales[item_name]["quantity"] += qty
                item_sales[item_name]["revenue"] += item.get("price", 0) * qty
        
        # Track order types
        order_type = order.get("order_type", "takeaway").lower()
        if "dine" in order_type:
            dine_in += 1
            # Track table
            table_num = order.get("table_number")
            if table_num:
                if table_num not in table_stats:
                    table_stats[table_num] = {"table": table_num, "orders": 0, "revenue": 0.0}
                table_stats[table_num]["orders"] += 1
                if status in ["delivered", "completed", "ready"]:
                    table_stats[table_num]["revenue"] += total
        elif order_type == "delivery":
            delivery += 1
        else:
            takeaway += 1
        
        # Track hourly
        dt = _parse_order_dt(order.get("created_at"))
        if dt:
            hour = dt.hour
            if hour not in hourly_stats:
                hourly_stats[hour] = {"hour": hour, "orders": 0, "revenue": 0.0}
            hourly_stats[hour]["orders"] += 1
            if status in ["delivered", "completed", "ready"]:
                hourly_stats[hour]["revenue"] += total
    
    # Sort items by quantity sold
    best_selling = sorted(item_sales.values(), key=lambda x: x["quantity"], reverse=True)[:10]
    
    # Sort peak hours by orders
    peak_hours = sorted(hourly_stats.values(), key=lambda x: x["orders"], reverse=True)[:5]
    
    # Sort tables by orders
    orders_per_table = sorted(table_stats.values(), key=lambda x: x["orders"], reverse=True)
    
    avg_order_value = total_sales / completed_orders if completed_orders > 0 else 0
    
    return {
        "date": date,
        "summary": {
            "total_sales": total_sales,
            "total_orders": total_orders,
            "completed_orders": completed_orders,
            "average_order_value": avg_order_value,
            "total_profit": 0,
            "profit_margin": 0
        },
        "order_types": {
            "dine_in": dine_in,
            "delivery": delivery,
            "takeaway": takeaway
        },
        "best_selling_items": best_selling,
        "peak_hours": peak_hours,
        "orders_per_table": orders_per_table
    }


@admin_router.get("/reports/period")
async def admin_get_period_report(
    start_date: str = None,
    end_date: str = None,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Get report for a date range"""
    if not start_date:
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0, microsecond=0)
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Fetch orders (internal read)
    all_orders = await manager._read("orders")
    
    orders = []
    for o in all_orders:
        dt = _parse_order_dt(o.get("created_at"))
        if dt and start <= dt <= end:
            orders.append(o)
            
    # Sort by created_at
    orders = sorted(orders, key=lambda x: x.get("created_at", ""))
    
    # Calculate totals
    total_sales = 0.0
    total_orders = len(orders)
    item_sales = {}
    daily_breakdown = {}
    
    for order in orders:
        # Parse created_at for date grouping
        created_dt = _parse_order_dt(order.get("created_at"))
        if not created_dt:
            continue
        
        order_date = created_dt.strftime("%Y-%m-%d")
        
        if order_date not in daily_breakdown:
            daily_breakdown[order_date] = {
                "date": order_date,
                "orders": 0,
                "revenue": 0.0,
                "dine_in": 0,
                "delivery": 0,
                "takeaway": 0
            }
        
        daily_breakdown[order_date]["orders"] += 1
        
        # Track order type
        order_type = order.get("order_type", "takeaway").lower()
        if "dine" in order_type:
            daily_breakdown[order_date]["dine_in"] += 1
        elif order_type == "delivery":
            daily_breakdown[order_date]["delivery"] += 1
        else:
            daily_breakdown[order_date]["takeaway"] += 1
        
        status = order.get("status", "")
        total = order.get("total", 0)
        
        if status in ["delivered", "completed", "ready"]:
            total_sales += total
            daily_breakdown[order_date]["revenue"] += total
            
            # Track items
            for item in order.get("items", []):
                item_name = item.get("name", "Unknown")
                if item_name not in item_sales:
                    item_sales[item_name] = {"name": item_name, "quantity": 0, "revenue": 0.0}
                item_sales[item_name]["quantity"] += item.get("quantity", 1)
                item_sales[item_name]["revenue"] += item.get("price", 0) * item.get("quantity", 1)
    
    # Sort items by quantity
    best_selling = sorted(item_sales.values(), key=lambda x: x["quantity"], reverse=True)[:10]
    
    # Sort daily breakdown by date
    daily_list = sorted(daily_breakdown.values(), key=lambda x: x["date"])
    
    # Calculate days in range
    days_count = (end - start).days + 1
    avg_daily_revenue = total_sales / days_count if days_count > 0 else 0
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "summary": {
            "total_sales": total_sales,
            "total_orders": total_orders,
            "average_daily_revenue": avg_daily_revenue,
            "total_profit": 0,  # Not tracking profit
            "profit_margin": 0   # Not tracking profit
        },
        "daily_breakdown": daily_list,
        "best_selling_items": best_selling
    }


# Admin Settings Management
@admin_router.get("/settings")
async def admin_get_settings(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all settings"""
    return await manager._read("settings")

@admin_router.put("/settings")
async def admin_update_setting(
    setting: SettingUpdate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Update or create setting"""
    await manager.update_setting(setting.key, setting.value)
    return {"key": setting.key, "value": setting.value}

# =============================================================================
# KITCHEN VIEW ENDPOINTS
# =============================================================================

@admin_router.get("/kitchen/orders")
async def admin_get_kitchen_orders(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all orders for kitchen view"""
    orders = await manager._read("orders")
    
    kitchen_orders = []
    active_orders = [o for o in orders if o.get("status") in ["accepted", "preparing"]]
    
    # Sort by accepted_at
    active_orders = sorted(active_orders, key=lambda x: x.get("accepted_at", ""))
    
    for order in active_orders:
        kitchen_orders.append({
            "order_id": order.get("order_id"),
            "kot_number": order.get("kot_number") or f"KOT-{(order.get('order_id') or '')[-4:].upper()}",
            "table_number": order.get("table_number"),
            "order_type": order.get("order_type", "DINE_IN"),
            "items": [{
                "name": item.get("name") or item.get("item_name"),
                "quantity": item.get("quantity", 1),
                "variant": item.get("variant"),
                "addons": [a.get("name") if isinstance(a, dict) else str(a) for a in item.get("addons", [])],
                "special_instructions": item.get("special_instructions")
            } for item in order.get("items", [])],
            "special_instructions": order.get("special_instructions") or order.get("cooking_instructions") or order.get("notes") or "",
            "status": order.get("status"),
            "accepted_at": order.get("accepted_at"),
            "created_at": order.get("created_at"),
            "customer_name": order.get("customer_name")
        })
    
    return kitchen_orders

@admin_router.get("/pending-orders")
async def admin_get_pending_orders(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all pending (placed) orders"""
    orders = await manager._read("orders")
    pending = [o for o in orders if o.get("status") == "placed"]
    return sorted(pending, key=lambda x: x.get("created_at", ""))

# =============================================================================
# TABLE MANAGEMENT ENDPOINTS
# =============================================================================

@admin_router.get("/tables")
async def admin_get_tables(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all tables with their status and today's reservations"""
    tables = await manager.get_tables()
    reservations = await manager._read("reservations")
    today_str = get_ist_now().strftime("%Y-%m-%d")
    today_res = [r for r in reservations if r.get("date") == today_str and r.get("status") in ["confirmed", "pending"]]
    
    table_data = []
    for table in tables:
        t_num = table.get("table_number")
        t_res = [r for r in today_res if r.get("table_number") == t_num]
        t_res_sorted = sorted(t_res, key=lambda x: x.get("time", ""))

        table_info = {
            "table_number": t_num,
            "capacity": table.get("capacity"),
            "status": table.get("status"),
            "current_session_id": table.get("current_session_id"),
            "current_order_id": table.get("current_order_id"),
            "current_order": None,
            "reservations_today": [
                {
                    "id": r.get("id") or r.get("_id"),
                    "customer_name": r.get("customer_name"),
                    "time": r.get("time"),
                    "guests": r.get("guests"),
                    "phone": r.get("phone"),
                    "status": r.get("status"),
                    "special_requests": r.get("special_requests")
                }
                for r in t_res_sorted
            ],
            "upcoming_reservation": {
                "id": t_res_sorted[0].get("id") or t_res_sorted[0].get("_id"),
                "customer_name": t_res_sorted[0].get("customer_name"),
                "time": t_res_sorted[0].get("time"),
                "guests": t_res_sorted[0].get("guests"),
                "phone": t_res_sorted[0].get("phone"),
                "status": t_res_sorted[0].get("status"),
                "special_requests": t_res_sorted[0].get("special_requests")
            } if t_res_sorted else None,
            "is_reserved_today": len(t_res_sorted) > 0
        }
        
        if table.get("current_order_id"):
            order = await manager.get_order_by_id(table["current_order_id"])
            if order:
                table_info["current_order"] = {
                    "order_id": order.get("order_id"),
                    "total": order.get("total"),
                    "items_count": sum([item.get("quantity", 0) for item in order.get("items", [])]),
                    "status": order.get("status"),
                    "created_at": order.get("created_at")
                }
        
        table_data.append(table_info)
    
    return table_data

@admin_router.post("/tables")
async def admin_create_table(
    table: TableCreate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Create a new table"""
    tables = await manager.get_tables()
    if any(t.get("table_number") == table.table_number for t in tables):
        raise HTTPException(status_code=400, detail="Table number already exists")
    
    table_data = {
        "table_number": table.table_number,
        "capacity": max(1, table.capacity),
        "status": "free",
        "created_at": datetime.utcnow().isoformat()
    }
    if hasattr(manager, "create_table"):
        return await manager.create_table(table_data)
    else:
        tables = await manager._read("tables")
        tables.append(table_data)
        await manager._write("tables", tables)
        return table_data

@admin_router.put("/tables/{table_number}")
async def admin_update_table(
    table_number: int,
    table_update: TableUpdate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Update table capacity, status, or table number"""
    tables = await manager.get_tables()
    existing = next((t for t in tables if t.get("table_number") == table_number), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Table not found")
    
    update_data = {}
    if table_update.capacity is not None:
        if table_update.capacity < 1:
            raise HTTPException(status_code=400, detail="Capacity must be at least 1")
        update_data["capacity"] = table_update.capacity
    if table_update.status is not None:
        update_data["status"] = table_update.status
    if table_update.table_number is not None and table_update.table_number != table_number:
        if any(t.get("table_number") == table_update.table_number for t in tables):
            raise HTTPException(status_code=400, detail="New table number already exists")
        update_data["table_number"] = table_update.table_number

    if hasattr(manager, "update_table"):
        updated = await manager.update_table(table_number, update_data)
        if updated:
            return updated

    tables = await manager._read("tables")
    for t in tables:
        if t.get("table_number") == table_number:
            t.update(update_data)
            await manager._write("tables", tables)
            return t
    raise HTTPException(status_code=404, detail="Table not found")

@admin_router.put("/tables/{table_number}/status")
async def admin_update_table_status(
    table_number: int,
    status_update: TableStatusUpdate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Update table status"""
    success = await manager.update_table_status(table_number, status_update.status)
    if not success:
        raise HTTPException(status_code=404, detail="Table not found")
    
    tables = await manager.get_tables()
    return next((t for t in tables if t.get("table_number") == table_number), None)

@admin_router.delete("/tables/{table_number}")
async def admin_delete_table(
    table_number: int,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Delete a table"""
    if hasattr(manager, "delete_table"):
        deleted = await manager.delete_table(table_number)
        if deleted:
            return {"message": "Table deleted successfully"}
    # Internal delete fallback
    tables = await manager._read("tables")
    new_tables = [t for t in tables if t.get("table_number") != table_number]
    if len(new_tables) == len(tables):
        raise HTTPException(status_code=404, detail="Table not found")
    await manager._write("tables", new_tables)
    return {"message": "Table deleted successfully"}

@admin_router.post("/tables/bulk-create")
async def admin_bulk_create_tables(
    count: int = 10,
    capacity: int = 4,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Create multiple tables at once"""
    tables = await manager.get_tables()
    highest = max([t.get("table_number", 0) for t in tables]) if tables else 0
    
    created_tables = []
    for i in range(1, count + 1):
        num = highest + i
        await manager.create_table({
            "table_number": num,
            "capacity": capacity,
            "status": "free",
            "created_at": datetime.utcnow().isoformat()
        })
        created_tables.append(num)
    
    return {"message": f"Created tables {created_tables[0]} to {created_tables[-1]}", "tables": created_tables}

# =============================================================================
# ADMIN SESSION MANAGEMENT ENDPOINTS
# =============================================================================

@admin_router.get("/table-sessions")
async def admin_get_table_sessions(
    status: Optional[str] = None,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Get all table sessions"""
    sessions = await manager._read("table_sessions")
    if status:
        sessions = [s for s in sessions if s.get("status") == status]
    
    # Sort by created_at desc
    sessions = sorted(sessions, key=lambda x: x.get("created_at", ""), reverse=True)
    
    session_list = []
    for session in sessions:
        session_dict = session.copy()
        orders = []
        for order_id in session.get("order_ids", []):
            order = await manager.get_order_by_id(order_id)
            if order:
                orders.append(order)
        session_dict["orders"] = orders
        
        active_orders = [o for o in orders if o.get("status") not in ["cancelled", "rejected", "pending_approval"]]
        session_dict["subtotal"] = sum(o.get("subtotal", 0) for o in active_orders)
        session_dict["taxes"] = sum(o.get("taxes", 0) for o in active_orders)
        session_dict["total"] = sum(o.get("total", 0) for o in active_orders)
        session_list.append(session_dict)
    
    return session_list

@admin_router.get("/table-sessions/pending")
async def admin_get_pending_session_orders(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all pending approval dine-in orders"""
    orders = await manager._read("orders")
    pending = [o for o in orders if o.get("order_type") == "DINE_IN" and o.get("status") == "pending_approval"]
    return sorted(pending, key=lambda x: x.get("created_at", ""), reverse=True)

@admin_router.post("/table-sessions/order/{order_id}/approve")
async def admin_approve_order(order_id: str, username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Approve a pending dine-in order"""
    now = datetime.utcnow()
    
    order = await manager.get_order_by_id(order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("status") != "pending_approval":
        raise HTTPException(status_code=400, detail="Order is not pending approval")
    
    history = order.get("status_history", [])
    history.append({
        "status": "accepted",
        "timestamp": now.isoformat(),
        "note": "Order approved by admin"
    })
    
    await manager.update_order(order_id, {
        "status": "accepted",
        "accepted_at": now.isoformat(),
        "status_history": history
    })
    
    if order.get("session_id"):
        session = await manager.get_table_session(order["session_id"])
        if session and session.get("status") == "pending":
            await manager.update_table_session(session["session_id"], {
                "status": "active"
            })
    
    await manager.update_table_status(order.get("table_number"), "occupied")
    
    return {"message": "Order approved", "order_id": order_id}

@admin_router.post("/table-sessions/order/{order_id}/reject")
async def admin_reject_order(order_id: str, reason: str = "Rejected by admin", username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Reject a pending dine-in order"""
    now = datetime.utcnow()
    
    order = await manager.get_order_by_id(order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    history = order.get("status_history", [])
    history.append({
        "status": "rejected",
        "timestamp": now.isoformat(),
        "note": reason
    })
    
    await manager.update_order(order_id, {
        "status": "rejected",
        "rejection_reason": reason,
        "status_history": history
    })
    
    return {"message": "Order rejected", "order_id": order_id}

@admin_router.post("/table-sessions/{session_id}/generate-bill")
async def admin_generate_session_bill(session_id: str, discount: float = 0, username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Generate final bill for a table session"""
    session = await manager.get_table_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all orders
    orders = []
    for order_id in session.get("order_ids", []):
        order = await manager.get_order_by_id(order_id)
        if order:
            orders.append(order)
            
    active_orders = [o for o in orders if o.get("status") not in ["cancelled", "rejected", "pending_approval"]]
    subtotal = sum(o.get("subtotal", 0) for o in active_orders)
    taxes = sum(o.get("taxes", 0) for o in active_orders)
    total = subtotal + taxes - discount

    # Assign bill number only once (avoid re-numbering if already has one)
    existing_bill_number = session.get("bill_number", "")
    if not existing_bill_number:
        bill_number, year_month = await generate_bill_number(manager)
    else:
        bill_number = existing_bill_number
        year_month = session.get("bill_year_month", get_ist_now().strftime('%Y-%m'))
    
    await manager.update_table_session(session_id, {
        "status": "billing",
        "subtotal": subtotal,
        "discount": discount,
        "taxes": taxes,
        "total": total,
        "bill_number": bill_number,
        "bill_year_month": year_month,
    })
    
    return {
        "session_id": session_id,
        "bill_number": bill_number,
        "table_number": session.get("table_number"),
        "customer_name": session.get("customer_name"),
        "orders": active_orders,
        "subtotal": subtotal,
        "discount": discount,
        "taxes": taxes,
        "total": total
    }

@admin_router.post("/table-sessions/{session_id}/close")
async def admin_close_session(session_id: str, payment_method: str = "cash", username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Close session after payment"""
    now = datetime.utcnow()
    
    session = await manager.get_table_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update all orders
    orders = await manager._read("orders")
    session_order_ids = session.get("order_ids", [])
    for o in orders:
        if o.get("order_id") in session_order_ids:
            o["status"] = "delivered"
            o["payment_status"] = "paid"
            o["payment_method"] = payment_method
            o["updated_at"] = now.isoformat()
    await manager._write("orders", orders)
    
    # Update session
    await manager.update_table_session(session_id, {
        "status": "closed",
        "payment_status": "paid",
        "payment_method": payment_method,
        "closed_at": now.isoformat()
    })
    
    # Free the table
    await manager.update_table_status(session.get("table_number"), "free")
    
    # Also clear session_id and order_id from table - handled inside update_table_status if we want
    # but let's be explicit and update internal table object if needed
    tables = await manager._read("tables")
    for t in tables:
        if t.get("table_number") == session.get("table_number"):
            t["current_session_id"] = None
            t["current_order_id"] = None
            break
    await manager._write("tables", tables)
    
    return {"message": "Session closed, table is now free", "session_id": session_id}

# =============================================================================
# DELIVERY PARTNER ENDPOINTS
# =============================================================================

@delivery_router.post("/login")
async def delivery_login(credentials: DeliveryPartnerLogin, manager: BaseDataManager = Depends(get_data_manager)):
    """Delivery partner login"""
    partner = await manager.get_delivery_partner_by_phone(credentials.phone)
    
    if not partner or not verify_password(credentials.password, partner["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password"
        )
    
    if not partner.get("active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    access_token = create_access_token(data={"sub": partner["phone"], "role": "delivery"})
    return TokenResponse(access_token=access_token)

@delivery_router.get("/profile")
async def delivery_get_profile(phone: str = Depends(verify_delivery_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get delivery partner profile"""
    partner = await manager.get_delivery_partner_by_phone(phone)
    if not partner:
        raise HTTPException(status_code=404, detail="Delivery partner not found")
    return {**partner, "password": ""}

@delivery_router.get("/orders")
async def delivery_get_assigned_orders(
    phone: str = Depends(verify_delivery_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Get ALL orders assigned to delivery partner (active + completed).
    Frontend handles tab splitting: active vs completed (delivered)."""
    partner = await manager.get_delivery_partner_by_phone(phone)
    if not partner:
        raise HTTPException(status_code=404, detail="Delivery partner not found")

    partner_id = partner.get("id") or partner.get("_id")
    orders = await manager.get_orders_by_partner(partner_id)

    # Include all relevant statuses â€” active AND completed
    visible_statuses = {"accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"}
    return sorted(
        [o for o in orders if o.get("status") in visible_statuses],
        key=lambda x: x.get("created_at", ""),
        reverse=True
    )

@delivery_router.put("/orders/{order_id}/status")
async def delivery_update_order_status(
    order_id: str,
    new_status: str,
    phone: str = Depends(verify_delivery_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Update order status by delivery partner"""
    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    allowed_statuses = ["out_for_delivery", "delivered"]
    if new_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status for delivery partner")
    
    now = datetime.utcnow()
    history = order.get("status_history", [])
    history.append({
        "status": new_status,
        "timestamp": now.isoformat(),
        "note": "Status updated by delivery partner"
    })
    
    update_data = {"status": new_status, "status_history": history}
    
    if new_status == "delivered":
        update_data["payment_status"] = "paid"
        partner = await manager.get_delivery_partner_by_phone(phone)
        if partner:
            current_orders = partner.get("current_orders", [])
            new_current_orders = [o for o in current_orders if o != order_id]
            partners = await manager._read("delivery_partners")
            for p in partners:
                if p.get("phone") == phone:
                    p["current_orders"] = new_current_orders
                    p["total_deliveries"] = p.get("total_deliveries", 0) + 1
                    break
            await manager._write("delivery_partners", partners)
        
        # Dispatch WhatsApp Bill / Receipt as soon as rider marks DELIVERED
        if order.get("order_type") != "DINE_IN":
            try:
                # Ensure monthly sequential bill number and invoice exist
                if not order.get("bill_number"):
                    bill_number, year_month = await generate_bill_number(manager)
                    update_data["bill_number"] = bill_number
                    update_data["bill_year_month"] = year_month
                    order["bill_number"] = bill_number
                    order["bill_year_month"] = year_month
                invoice_url = await create_order_invoice(order_id, manager)
                if invoice_url:
                    update_data["invoice_url"] = invoice_url
                    order["invoice_url"] = invoice_url

                order_for_bill = {**order, **update_data}
                bill_res = await send_order_delivered_bill(order_for_bill)
                if bill_res.get("success"):
                    update_data["whatsapp_bill_sent"] = True
                    update_data["whatsapp_bill_id"] = bill_res.get("message_id")
                    logging.info(f"[WhatsApp] Rider delivered bill sent for order {order_id} (wamid: {bill_res.get('message_id')})")
                else:
                    update_data["whatsapp_bill_error"] = bill_res.get("error")
                    logging.info(f"[WhatsApp] Rider delivered bill notice for order {order_id}: {bill_res.get('error')}")
            except Exception as bill_err:
                logging.warning(f"[WhatsApp] Error sending rider delivered bill: {bill_err}")
    
    await manager.update_order(order_id, update_data)
    return await manager.get_order_by_id(order_id)

# =============================================================================
# KITCHEN STAFF ADMIN CRUD
# =============================================================================

@admin_router.get("/kitchen-staff")
async def admin_get_kitchen_staff(username: str = Depends(verify_token),
                                  manager: BaseDataManager = Depends(get_data_manager)):
    """Get all kitchen staff members"""
    staff = await manager._read("kitchen_staff")
    return [{"id": s.get("id", s.get("_id")), "staff_id": s.get("staff_id"),
             "name": s.get("name"), "phone": s.get("phone",""),
             "active": s.get("active", True)} for s in staff]


@admin_router.post("/kitchen-staff")
async def admin_create_kitchen_staff(data: dict,
                                     username: str = Depends(verify_token),
                                     manager: BaseDataManager = Depends(get_data_manager)):
    """Create a new kitchen staff member"""
    staff = await manager._read("kitchen_staff")
    if any(s.get("staff_id") == data.get("staff_id") for s in staff):
        raise HTTPException(status_code=400, detail="Staff ID already exists")

    new_member = {
        "id": str(uuid.uuid4()),
        "staff_id": data["staff_id"],
        "name": data["name"],
        "phone": data.get("phone", ""),
        "password": get_password_hash(data["password"]),
        "active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    staff.append(new_member)
    await manager._write("kitchen_staff", staff)
    return {"message": "Kitchen staff created", "staff_id": new_member["staff_id"]}


@admin_router.put("/kitchen-staff/{member_id}")
async def admin_update_kitchen_staff(member_id: str, data: dict,
                                     username: str = Depends(verify_token),
                                     manager: BaseDataManager = Depends(get_data_manager)):
    """Update kitchen staff member"""
    staff = await manager._read("kitchen_staff")
    member = next((s for s in staff if s.get("id") == member_id or s.get("staff_id") == member_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="Staff member not found")
    if "name" in data: member["name"] = data["name"]
    if "phone" in data: member["phone"] = data["phone"]
    if "active" in data: member["active"] = data["active"]
    if "password" in data and data["password"]:
        member["password"] = get_password_hash(data["password"])
    await manager._write("kitchen_staff", staff)
    return {"message": "Updated"}


@admin_router.delete("/kitchen-staff/{member_id}")
async def admin_delete_kitchen_staff(member_id: str,
                                     username: str = Depends(verify_token),
                                     manager: BaseDataManager = Depends(get_data_manager)):
    """Delete kitchen staff member"""
    staff = await manager._read("kitchen_staff")
    new_list = [s for s in staff if s.get("id") != member_id and s.get("staff_id") != member_id]
    if len(new_list) == len(staff):
        raise HTTPException(status_code=404, detail="Staff member not found")
    await manager._write("kitchen_staff", new_list)
    return {"message": "Deleted"}


# =============================================================================
# KITCHEN ROUTES  (standalone kitchen_router, separate from admin)
# =============================================================================

@kitchen_router.post("/login")
async def kitchen_login(data: dict, manager: BaseDataManager = Depends(get_data_manager)):
    """Kitchen staff login with staff_id + password"""
    staff_list = await manager._read("kitchen_staff")
    member = next((s for s in staff_list if s.get("staff_id") == data.get("staff_id")), None)
    if not member or not verify_password(data.get("password", ""), member["password"]):
        raise HTTPException(status_code=401, detail="Incorrect Staff ID or password")
    if not member.get("active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    token = create_access_token(data={"sub": member["staff_id"], "role": "kitchen",
                                      "name": member.get("name", "")})
    return {"access_token": token, "token_type": "bearer",
            "name": member.get("name"), "staff_id": member["staff_id"]}


@kitchen_router.get("/orders")
async def kitchen_get_orders(staff_id: str = Depends(verify_kitchen_token),
                             manager: BaseDataManager = Depends(get_data_manager)):
    """Get active kitchen orders (accepted + preparing) â€” same logic as admin kitchen view"""
    orders = await manager._read("orders")
    active = sorted(
        [o for o in orders if o.get("status") in ["accepted", "preparing"]],
        key=lambda x: x.get("accepted_at", x.get("created_at", ""))
    )
    return [{
        "order_id": o.get("order_id"),
        "kot_number": o.get("kot_number") or f"KOT-{(o.get('order_id') or '')[-4:].upper()}",
        "table_number": o.get("table_number"),
        "order_type": o.get("order_type", "DINE_IN"),
        "source": o.get("source", ""),
        "items": [{"name": i.get("name") or i.get("item_name"), "quantity": i.get("quantity", 1),
                   "variant": i.get("variant"),
                   "addons": [a.get("name") if isinstance(a, dict) else str(a) for a in i.get("addons", [])],
                   "special_instructions": i.get("special_instructions")}
                  for i in o.get("items", [])],
        "special_instructions": o.get("special_instructions") or o.get("cooking_instructions") or o.get("notes") or "",
        "status": o.get("status"),
        "created_at": o.get("created_at"),
        "accepted_at": o.get("accepted_at"),
        "customer_name": o.get("customer_name")
    } for o in active]


@kitchen_router.put("/orders/{order_id}/status")
async def kitchen_update_order_status(order_id: str, data: dict,
                                      staff_id: str = Depends(verify_kitchen_token),
                                      manager: BaseDataManager = Depends(get_data_manager)):
    """Update order status from kitchen (acceptedâ†’preparing, preparingâ†’ready)"""
    order = await manager.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    new_status = data.get("status")
    allowed = {"accepted": ["preparing"], "preparing": ["ready"]}
    if new_status not in allowed.get(order.get("status", ""), []):
        raise HTTPException(status_code=400,
                            detail=f"Cannot move from {order.get('status')} to {new_status}")
    now = datetime.utcnow()
    history = order.get("status_history", [])
    history.append({"status": new_status, "timestamp": now.isoformat(),
                    "note": f"Marked by kitchen staff {staff_id}"})
    update_data = {"status": new_status, "status_history": history}
    if new_status == "ready":
        update_data["ready_at"] = now.isoformat()
    await manager.update_order(order_id, update_data)
    return {"message": "Status updated", "new_status": new_status}


# =============================================================================
# CAPTAIN ROUTES
# =============================================================================

captain_router = APIRouter(prefix="/api/captain", tags=["captain"])

@captain_router.post("/login")
async def captain_login(credentials: CaptainLogin, manager: BaseDataManager = Depends(get_data_manager)):
    """Captain login with captain_id + password"""
    captains = await manager._read("captains")
    captain = next((c for c in captains if c.get("captain_id") == credentials.captain_id), None)
    
    if not captain or not verify_password(credentials.password, captain["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect Captain ID or password")
    
    if not captain.get("active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    access_token = create_access_token(data={"sub": captain["captain_id"], "role": "captain",
                                             "name": captain.get("name", "")})
    return {"access_token": access_token, "token_type": "bearer",
            "name": captain.get("name"), "captain_id": captain["captain_id"]}


@captain_router.get("/tables")
async def captain_get_tables(captain_id: str = Depends(verify_captain_token),
                              manager: BaseDataManager = Depends(get_data_manager)):
    """Get all tables with live status and today's reservations for captain panel"""
    tables = await manager.get_tables()
    reservations = await manager._read("reservations")
    today_str = get_ist_now().strftime("%Y-%m-%d")
    today_res = [r for r in reservations if r.get("date") == today_str and r.get("status") in ["confirmed", "pending"]]
    
    result = []
    for t in tables:
        t_num = t.get("table_number")
        t_res = [r for r in today_res if r.get("table_number") == t_num]
        t_res_sorted = sorted(t_res, key=lambda x: x.get("time", ""))

        info = {
            "table_number": t_num,
            "capacity": t.get("capacity"),
            "status": t.get("status"),  # free / occupied / reserved
            "current_session_id": t.get("current_session_id"),
            "current_order_id": t.get("current_order_id"),
            "reservations_today": [
                {
                    "id": r.get("id") or r.get("_id"),
                    "customer_name": r.get("customer_name"),
                    "time": r.get("time"),
                    "guests": r.get("guests"),
                    "phone": r.get("phone"),
                    "status": r.get("status"),
                    "special_requests": r.get("special_requests")
                }
                for r in t_res_sorted
            ],
            "upcoming_reservation": {
                "id": t_res_sorted[0].get("id") or t_res_sorted[0].get("_id"),
                "customer_name": t_res_sorted[0].get("customer_name"),
                "time": t_res_sorted[0].get("time"),
                "guests": t_res_sorted[0].get("guests"),
                "phone": t_res_sorted[0].get("phone"),
                "status": t_res_sorted[0].get("status"),
                "special_requests": t_res_sorted[0].get("special_requests")
            } if t_res_sorted else None,
            "is_reserved_today": len(t_res_sorted) > 0
        }
        result.append(info)
    return result


@captain_router.get("/tables/{table_number}/session")
async def captain_get_table_session(table_number: int,
                                     captain_id: str = Depends(verify_captain_token),
                                     manager: BaseDataManager = Depends(get_data_manager)):
    """Get active session for a table with all orders and their statuses"""
    tables = await manager.get_tables()
    table = next((t for t in tables if t.get("table_number") == table_number), None)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    session_id = table.get("current_session_id")
    if not session_id or table.get("status") == "free":
        return {"has_session": False, "session": None}
    
    session = await manager.get_table_session(session_id)
    if not session:
        return {"has_session": False, "session": None}
    
    orders = []
    for oid in session.get("order_ids", []):
        o = await manager.get_order_by_id(oid)
        if o:
            orders.append({
                "order_id": o.get("order_id"),
                "items": o.get("items", []),
                "status": o.get("status"),
                "subtotal": o.get("subtotal"),
                "total": o.get("total"),
                "created_at": o.get("created_at"),
            })
    
    active = [o for o in orders if o.get("status") not in ["cancelled", "rejected"]]
    return {
        "has_session": True,
        "session": {
            **session,
            "orders": orders,
            "subtotal": sum(o.get("subtotal", 0) for o in active),
            "total": sum(o.get("total", 0) for o in active),
        }
    }


@captain_router.post("/order")
async def captain_place_order(data: CaptainOrderCreate,
                               captain_id: str = Depends(verify_captain_token),
                               manager: BaseDataManager = Depends(get_data_manager)):
    """Captain places/adds order for a table â€” creates session if needed"""
    now = get_ist_now()
    
    # Find or create session
    session = None
    if data.session_id:
        session = await manager.get_table_session(data.session_id)
    
    if not session:
        tables = await manager.get_tables()
        table = next((t for t in tables if t.get("table_number") == data.table_number), None)
        if table and table.get("current_session_id"):
            session = await manager.get_table_session(table["current_session_id"])
    
    if not session:
        session_id = generate_session_id()
        session = await manager.create_table_session({
            "session_id": session_id,
            "table_number": data.table_number,
            "customer_name": data.customer_name,
            "status": "active",
            "order_ids": [],
            "subtotal": 0.0,
            "total": 0.0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        })
    
    subtotal = sum(item.price * item.quantity for item in data.items)
    taxes = round(subtotal * 0.05, 2)
    total = round(subtotal + taxes, 2)
    order_id = generate_order_id()
    kot_num = generate_kot_number()
    
    order_data = {
        "order_id": order_id,
        "session_id": session["session_id"],
        "customer_name": data.customer_name or session.get("customer_name", "Guest"),
        "phone": "",
        "address": f"Table {data.table_number}",
        "items": [item.dict() for item in data.items],
        "subtotal": subtotal,
        "discount": 0.0,
        "delivery_fee": 0.0,
        "taxes": taxes,
        "total": total,
        "status": "accepted",  # Captain orders go straight to accepted (skip placed)
        "order_type": "DINE_IN",
        "table_number": data.table_number,
        "kot_number": kot_num,
        "accepted_at": now.isoformat(),
        "payment_method": "pay_at_counter",
        "payment_status": "pending",
        "source": "captain",
        "captain_id": captain_id,
        "status_history": [{
            "status": "accepted",
            "timestamp": now.isoformat(),
            "note": f"Order taken by Captain {captain_id} â€” KOT#{kot_num}"
        }],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    
    created_order = await manager.create_order(order_data)
    
    # Update session
    order_ids = session.get("order_ids", []) + [order_id]
    await manager.update_table_session(session["session_id"], {
        "order_ids": order_ids,
        "status": "active",
        "subtotal": session.get("subtotal", 0.0) + subtotal,
        "total": session.get("total", 0.0) + total,
        "updated_at": now.isoformat(),
    })
    
    # Mark table occupied
    await manager.update_table_status(data.table_number, "occupied", order_id)
    # Also store session_id on table
    tables = await manager._read("tables")
    for t in tables:
        if t.get("table_number") == data.table_number:
            t["current_session_id"] = session["session_id"]
            break
    await manager._write("tables", tables)
    
    return {"order": created_order, "session_id": session["session_id"],
            "kot_number": kot_num, "message": "Order sent to kitchen"}


@captain_router.post("/sessions/{session_id}/close")
async def captain_close_session(session_id: str,
                                 payment_method: str = "cash",
                                 captain_id: str = Depends(verify_captain_token),
                                 manager: BaseDataManager = Depends(get_data_manager)):
    """Captain closes bill for a table (collects payment)"""
    now = datetime.utcnow()
    session = await manager.get_table_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Mark all orders as delivered/paid
    orders = await manager._read("orders")
    for o in orders:
        if o.get("order_id") in session.get("order_ids", []):
            o["status"] = "delivered"
            o["payment_status"] = "paid"
            o["payment_method"] = payment_method
            o["updated_at"] = now.isoformat()
    await manager._write("orders", orders)
    
    await manager.update_table_session(session_id, {
        "status": "closed",
        "payment_status": "paid",
        "payment_method": payment_method,
        "closed_at": now.isoformat(),
    })
    
    await manager.update_table_status(session.get("table_number"), "free")
    tables = await manager._read("tables")
    for t in tables:
        if t.get("table_number") == session.get("table_number"):
            t["current_session_id"] = None
            t["current_order_id"] = None
            break
    await manager._write("tables", tables)
    
    return {"message": "Bill closed, table is now free", "session_id": session_id}


# =============================================================================
# ADMIN â€” CAPTAIN MANAGEMENT
# =============================================================================

@admin_router.get("/captains")
async def admin_get_captains(username: str = Depends(verify_token),
                              manager: BaseDataManager = Depends(get_data_manager)):
    """Get all captains"""
    captains = await manager._read("captains")
    return [{**c, "password": ""} for c in captains]


@admin_router.post("/captains")
async def admin_create_captain(captain: CaptainCreate,
                                username: str = Depends(verify_token),
                                manager: BaseDataManager = Depends(get_data_manager)):
    """Create new captain account"""
    captains = await manager._read("captains")
    if any(c.get("captain_id") == captain.captain_id for c in captains):
        raise HTTPException(status_code=400, detail="Captain ID already exists")
    
    new_captain = {
        "id": str(uuid.uuid4()),
        "captain_id": captain.captain_id,
        "name": captain.name,
        "phone": captain.phone,
        "password": get_password_hash(captain.password),
        "active": True,
        "created_at": datetime.utcnow().isoformat(),
    }
    captains.append(new_captain)
    await manager._write("captains", captains)
    return {**new_captain, "password": ""}


@admin_router.put("/captains/{captain_id}")
async def admin_update_captain(captain_id: str,
                                update: CaptainUpdate,
                                username: str = Depends(verify_token),
                                manager: BaseDataManager = Depends(get_data_manager)):
    """Update captain"""
    captains = await manager._read("captains")
    captain = next((c for c in captains if c.get("id") == captain_id or c.get("captain_id") == captain_id), None)
    if not captain:
        raise HTTPException(status_code=404, detail="Captain not found")
    
    if update.name is not None: captain["name"] = update.name
    if update.phone is not None: captain["phone"] = update.phone
    if update.active is not None: captain["active"] = update.active
    if update.password is not None: captain["password"] = get_password_hash(update.password)
    
    await manager._write("captains", captains)
    return {**captain, "password": ""}


@admin_router.delete("/captains/{captain_id}")
async def admin_delete_captain(captain_id: str,
                                username: str = Depends(verify_token),
                                manager: BaseDataManager = Depends(get_data_manager)):
    """Delete captain"""
    captains = await manager._read("captains")
    new_captains = [c for c in captains if c.get("id") != captain_id and c.get("captain_id") != captain_id]
    if len(new_captains) == len(captains):
        raise HTTPException(status_code=404, detail="Captain not found")
    await manager._write("captains", new_captains)
    return {"message": "Captain deleted"}


# =============================================================================
# PD COINS / LOYALTY MANAGEMENT (Admin Panel)
# =============================================================================

class LoyaltyAwardRequest(BaseModel):
    customer_id: str  # _id from customers collection
    bill_amount: float
    note: Optional[str] = None

class LoyaltyRedeemRequest(BaseModel):
    customer_id: str  # _id from customers collection
    coins_to_redeem: int
    note: Optional[str] = None

@admin_router.get("/loyalty/search")
async def admin_loyalty_search(
    q: str = "",
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Search customers by phone number or name for loyalty operations. Auto-expires stale coins."""
    if not q or len(q.strip()) < 2:
        return []

    query = q.strip().lower()
    customers = await manager._read("customers")
    matched = []
    customers_modified = False

    for i, c in enumerate(customers):
        name_match  = query in (c.get("name") or "").lower()
        phone_match = query in (c.get("phone") or "").replace(" ", "")
        email_match = query in (c.get("email") or "").lower()

        if name_match or phone_match or email_match:
            # Auto-expire coins before surfacing to admin
            coins_before = c.get("pd_coins", 0)
            c = apply_coin_expiry(c)
            if c.get("pd_coins", 0) != coins_before:
                c["updated_at"] = get_ist_now().isoformat()
                customers[i] = c
                customers_modified = True

            matched.append({
                "_id": c.get("_id"),
                "uid": c.get("uid"),
                "name": c.get("name", "Customer"),
                "phone": c.get("phone", ""),
                "email": c.get("email", ""),
                "picture": c.get("picture", ""),
                "pd_coins": c.get("pd_coins", 0),
                "coins_history": c.get("coins_history", [])[-20:],  # Last 20 transactions
                "created_at": c.get("created_at", ""),
            })

    if customers_modified:
        await manager._write("customers", customers)

    return matched[:10]  # Max 10 results


@admin_router.post("/loyalty/award")
async def admin_loyalty_award(
    data: LoyaltyAwardRequest,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Award PD Coins to customer (10% of bill amount)"""
    if data.bill_amount <= 0:
        raise HTTPException(status_code=400, detail="Bill amount must be positive")

    customers = await manager._read("customers")
    idx = next((i for i, c in enumerate(customers) if c.get("_id") == data.customer_id), None)

    if idx is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    coins_to_award = int(data.bill_amount * 0.10)  # 10% of bill
    if coins_to_award <= 0:
        raise HTTPException(status_code=400, detail="Bill amount too small to earn coins")

    # Auto-expire stale coins before balance calculation
    customers[idx] = apply_coin_expiry(customers[idx])

    now = get_ist_now().isoformat()
    current_coins = customers[idx].get("pd_coins", 0)
    new_balance = current_coins + coins_to_award

    # Create transaction record
    txn = {
        "type": "earned",
        "coins": coins_to_award,
        "bill_amount": data.bill_amount,
        "balance_after": new_balance,
        "note": data.note or f"10% of â‚¹{data.bill_amount:,.0f} bill",
        "awarded_by": username,
        "timestamp": now,
    }

    history = customers[idx].get("coins_history", [])
    history.append(txn)

    customers[idx]["pd_coins"] = new_balance
    customers[idx]["coins_history"] = history
    customers[idx]["updated_at"] = now

    await manager._write("customers", customers)

    return {
        "success": True,
        "coins_awarded": coins_to_award,
        "new_balance": new_balance,
        "customer_name": customers[idx].get("name", "Customer"),
        "transaction": txn,
    }


@admin_router.post("/loyalty/redeem")
async def admin_loyalty_redeem(
    data: LoyaltyRedeemRequest,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Redeem PD Coins from customer wallet (1 coin = â‚¹1 discount)"""
    if data.coins_to_redeem <= 0:
        raise HTTPException(status_code=400, detail="Coins to redeem must be positive")

    customers = await manager._read("customers")
    idx = next((i for i, c in enumerate(customers) if c.get("_id") == data.customer_id), None)

    if idx is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Auto-expire stale coins before balance check
    customers[idx] = apply_coin_expiry(customers[idx])

    current_coins = customers[idx].get("pd_coins", 0)
    if data.coins_to_redeem > current_coins:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient coins. Customer has {current_coins} coins, trying to redeem {data.coins_to_redeem}"
        )

    now = get_ist_now().isoformat()
    new_balance = current_coins - data.coins_to_redeem

    txn = {
        "type": "redeemed",
        "coins": data.coins_to_redeem,
        "discount_value": data.coins_to_redeem,  # 1 coin = â‚¹1
        "balance_after": new_balance,
        "note": data.note or f"Redeemed â‚¹{data.coins_to_redeem} discount",
        "redeemed_by": username,
        "timestamp": now,
    }

    history = customers[idx].get("coins_history", [])
    history.append(txn)

    customers[idx]["pd_coins"] = new_balance
    customers[idx]["coins_history"] = history
    customers[idx]["updated_at"] = now

    await manager._write("customers", customers)

    return {
        "success": True,
        "coins_redeemed": data.coins_to_redeem,
        "discount_value": data.coins_to_redeem,
        "new_balance": new_balance,
        "customer_name": customers[idx].get("name", "Customer"),
        "transaction": txn,
    }


@admin_router.get("/loyalty/transactions")
async def admin_loyalty_transactions(
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Get recent loyalty transactions across all customers (audit trail)"""
    customers = await manager._read("customers")
    all_txns = []

    for c in customers:
        for txn in c.get("coins_history", []):
            all_txns.append({
                **txn,
                "customer_name": c.get("name", "Customer"),
                "customer_phone": c.get("phone", ""),
                "customer_id": c.get("_id"),
            })

    # Sort by timestamp descending, return last 50
    all_txns.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return all_txns[:50]


# =============================================================================
# CUSTOMER ROUTER (Swiggy/Zomato style public user dashboard & history)
# =============================================================================
customer_router = APIRouter(prefix="/api/customer", tags=["customer"])

@customer_router.get("/profile")
async def get_customer_profile(
    user: dict = Depends(verify_customer_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Fetch logged in customer profile, auto-creating if first time. Auto-expires stale coins."""
    uid = user["uid"]
    customers = await manager._read("customers")
    idx = next((i for i, c in enumerate(customers) if c.get("uid") == uid), None)

    if idx is None:
        now = get_ist_now().isoformat()
        profile = {
            "_id": str(uuid.uuid4()),
            "uid": uid,
            "email": user.get("email", ""),
            "name": user.get("name", "Customer"),
            "phone": "",
            "picture": user.get("picture", ""),
            "address": "",
            "addresses": [],
            "pd_coins": 0,
            "coins_history": [],
            "created_at": now,
            "updated_at": now
        }
        customers.append(profile)
        await manager._write("customers", customers)
        return profile

    profile = customers[idx]
    # Auto-expire coins older than 45 days on every profile fetch
    coins_before = profile.get("pd_coins", 0)
    profile = apply_coin_expiry(profile)
    if profile.get("pd_coins", 0) != coins_before:
        profile["updated_at"] = get_ist_now().isoformat()
        customers[idx] = profile
        await manager._write("customers", customers)

    return profile

@customer_router.put("/profile")
async def update_customer_profile(
    update_data: CustomerProfileUpdate,
    user: dict = Depends(verify_customer_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Update customer profile (phone number, name, delivery address)"""
    uid = user["uid"]
    customers = await manager._read("customers")
    profile_idx = next((i for i, c in enumerate(customers) if c.get("uid") == uid), None)
    now = get_ist_now().isoformat()

    if profile_idx is None:
        addr = update_data.address.strip() if update_data.address else ""
        new_profile = {
            "_id": str(uuid.uuid4()),
            "uid": uid,
            "email": user.get("email", ""),
            "name": update_data.name or user.get("name", "Customer"),
            "phone": update_data.phone.strip() if update_data.phone else "",
            "picture": user.get("picture", ""),
            "address": addr,
            "addresses": update_data.addresses or ([addr] if addr else []),
            "pd_coins": 0,
            "coins_history": [],
            "created_at": now,
            "updated_at": now
        }
        customers.append(new_profile)
        await manager._write("customers", customers)
        return new_profile
    
    current = customers[profile_idx]
    if update_data.name is not None:
        current["name"] = update_data.name
    if update_data.phone is not None:
        current["phone"] = update_data.phone.strip()
    if update_data.address is not None:
        current["address"] = update_data.address.strip()
        addrs = current.setdefault("addresses", [])
        if update_data.address.strip() and update_data.address.strip() not in addrs:
            addrs.append(update_data.address.strip())
    if update_data.addresses is not None:
        current["addresses"] = update_data.addresses
        
    current["updated_at"] = now
    customers[profile_idx] = current
    await manager._write("customers", customers)
    return current

@customer_router.get("/orders")
async def get_customer_orders_list(
    user: dict = Depends(verify_customer_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Get all orders belonging to customer by UID, phone, or email"""
    uid = user["uid"]
    user_email = (user.get("email") or "").lower().strip()
    
    customers = await manager._read("customers")
    profile = next((c for c in customers if c.get("uid") == uid), None)
    user_phone = profile.get("phone", "").strip() if profile else ""
    
    all_orders = await manager._read("orders")
    matched = []
    seen_ids = set()
    
    for o in all_orders:
        oid = o.get("order_id") or o.get("_id") or o.get("id")
        if not oid or oid in seen_ids:
            continue
        
        # Match by customer_uid
        if o.get("customer_uid") and o.get("customer_uid") == uid:
            matched.append(o)
            seen_ids.add(oid)
            continue
            
        # Match by phone
        if user_phone and o.get("phone") and o.get("phone").strip() == user_phone:
            matched.append(o)
            seen_ids.add(oid)
            continue
            
        # Match by email
        if user_email and o.get("email") and o.get("email").lower().strip() == user_email:
            matched.append(o)
            seen_ids.add(oid)
            continue

    return sorted(matched, key=lambda x: x.get("created_at", ""), reverse=True)

@customer_router.get("/reservations")
async def get_customer_reservations_list(
    user: dict = Depends(verify_customer_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Get all reservations belonging to customer by UID, phone, or email"""
    uid = user["uid"]
    user_email = (user.get("email") or "").lower().strip()
    
    customers = await manager._read("customers")
    profile = next((c for c in customers if c.get("uid") == uid), None)
    user_phone = profile.get("phone", "").strip() if profile else ""
    
    all_res = await manager._read("reservations")
    matched = []
    seen_ids = set()
    
    for r in all_res:
        rid = r.get("id") or r.get("_id")
        if not rid or rid in seen_ids:
            continue
            
        if r.get("customer_uid") and r.get("customer_uid") == uid:
            matched.append(r)
            seen_ids.add(rid)
            continue
            
        if user_phone and r.get("phone") and r.get("phone").strip() == user_phone:
            matched.append(r)
            seen_ids.add(rid)
            continue
            
        if user_email and r.get("email") and r.get("email").lower().strip() == user_email:
            matched.append(r)
            seen_ids.add(rid)
            continue

    return sorted(matched, key=lambda x: x.get("created_at", ""), reverse=True)


# =============================================================================
# STARTUP AND SHUTDOWN EVENTS
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize database and warm cache on startup"""
    db_mode = os.environ.get("DB_MODE", "POSTGRES")
    if db_mode == "POSTGRES":
        logger.info("Initializing PostgreSQL database...")
        await init_db()
        await seed_database()
        logger.info("PostgreSQL database initialized successfully")
    else:
        logger.info(f"Running in {db_mode} mode. Bypassing PostgreSQL initialization.")
        try:
            manager = get_data_manager()
            logger.info("DataManager and Firebase pre-initialized successfully.")

            # ----------------------------------------------------------------
            # CACHE WARMUP -- preload hot data so the very first visitor gets
            # a fast (~2ms) response instead of a cold Firestore round-trip.
            # ----------------------------------------------------------------
            try:
                logger.info("Warming cache: fetching menu, reviews, gallery from Firestore...")
                import asyncio
                await asyncio.gather(
                    manager.get_menu(),            # warms menu_public cache
                    manager.get_all_menu_items(),  # warms menu_admin cache
                    manager.get_reviews(),         # warms reviews cache
                    manager.get_gallery(),         # warms gallery cache
                )
                logger.info("Cache warmup complete. First user will get fast responses.")
            except Exception as warm_err:
                logger.warning(f"Cache warmup failed (non-fatal): {warm_err}")

        except Exception as e:
            logger.warning(f"Could not pre-initialize DataManager on startup: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database on shutdown"""
    if os.environ.get("DB_MODE") == "POSTGRES":
        await close_db()
        logger.info("Database connection closed")

# =============================================================================
# CORS AND ROUTERS
# =============================================================================

# NOTE: CORS is already configured at the top of this file with ALLOWED_ORIGINS.
# The duplicate wildcard middleware has been removed because allow_origins=["*"]
# combined with allow_credentials=True is invalid per the CORS spec and causes
# browsers to block cross-origin requests.

app.include_router(api_router)
app.include_router(admin_router)
app.include_router(delivery_router)
app.include_router(captain_router)
app.include_router(kitchen_router)
app.include_router(customer_router)

# Health check endpoint
@api_router.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    db_mode = os.environ.get("DB_MODE", "POSTGRES")
    return {"status": "healthy", "mode": db_mode}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
