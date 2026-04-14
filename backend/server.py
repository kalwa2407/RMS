from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from datetime import timezone, timedelta
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.orm import selectinload
import os
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Optional
import shutil
import random
import string

# Import database and models (keep get_db for now to avoid breaking legacy code)
from database import init_db, close_db, get_db
from data_manager import get_data_manager, BaseDataManager
from models import *
from auth import verify_password, get_password_hash, create_access_token, verify_token
from invoice_generator import generate_invoice_pdf

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI()

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://rms.tasteofhindustan.com",
    "https://tasteofhindustan.com",
    # Allow all Vercel preview deployments
    "https://rms-kalwa2407.vercel.app",
]
# Allow any *.vercel.app origin at runtime
import re

class DynamicCORSMiddleware:
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload and invoice directories
UPLOAD_DIR = ROOT_DIR / "static" / "uploads"
INVOICE_DIR = ROOT_DIR / "static" / "invoices"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
INVOICE_DIR.mkdir(parents=True, exist_ok=True)

# Serve static files
app.mount("/static", StaticFiles(directory=str(ROOT_DIR / "static")), name="static")

# Create routers
api_router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/api/admin", tags=["admin"])
delivery_router = APIRouter(prefix="/api/delivery", tags=["delivery"])

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

def get_ist_now():
    """Get current IST datetime"""
    return datetime.now(timezone(timedelta(hours=5, minutes=30)))

async def create_order_invoice(order_id: str, manager: BaseDataManager):
    """Generate invoice PDF for an order"""
    try:
        order = await manager.get_order_by_id(order_id)
        if not order:
            logger.error(f"Order not found: {order_id}")
            return None
        
        # Generate PDF
        invoice_filename = f"invoice_{order_id}.pdf"
        invoice_path = INVOICE_DIR / invoice_filename
        generate_invoice_pdf(order, str(invoice_path))
        
        # Update order with invoice URL
        invoice_url = f"/static/invoices/{invoice_filename}"
        await manager.update_order_status(order_id, order["status"], {"status": order["status"], "timestamp": datetime.now().isoformat(), "note": "Invoice generated"})
        
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
    """Get all available menu items, optionally filtered by category"""
    return await manager.get_menu(category)

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

# Gallery Endpoints
@api_router.get("/gallery")
async def get_gallery(manager: BaseDataManager = Depends(get_data_manager)):
    """Get all gallery images"""
    return await manager.get_gallery()

# Reviews Endpoints
@api_router.get("/reviews")
async def get_reviews(manager: BaseDataManager = Depends(get_data_manager)):
    """Get all reviews"""
    return await manager.get_reviews()

@api_router.get("/settings/public")
async def get_public_settings(manager: BaseDataManager = Depends(get_data_manager)):
    """Get public settings like contact info"""
    settings = await manager.get_settings()
    public_keys = ["contact_address", "contact_phone", "contact_email", "opening_hours"]
    return {k: v for k, v in settings.items() if k in public_keys}

# Coupon Validation
@api_router.post("/coupons/validate")
async def validate_coupon(coupon_validation: CouponValidation, manager: BaseDataManager = Depends(get_data_manager)):
    """Validate a coupon code"""
    coupon = await manager.validate_coupon(coupon_validation.code)
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if coupon_validation.order_value < coupon.get("min_order_value", 0):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order value of ₹{coupon.get('min_order_value')} required"
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

# Orders Endpoints
@api_router.post("/orders")
async def create_order(order: OrderCreate, manager: BaseDataManager = Depends(get_data_manager)):
    """Create a new order with validation"""
    
    if order.order_type == "DELIVERY" and order.subtotal < 250:
        raise HTTPException(
            status_code=400,
            detail="Minimum order value is ₹250 for delivery"
        )
    
    now = get_ist_now()
    order_dict = order.dict()
    order_id = generate_order_id()
    
    order_dict.update({
        "order_id": order_id,
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
        return {"session": existing, "message": "Session already exists"}
    
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
async def create_reservation(reservation: ReservationCreate, manager: BaseDataManager = Depends(get_data_manager)):
    """Create a new reservation"""
    now = get_ist_now()
    reservation_data = reservation.dict()
    reservation_data.update({
        "status": "pending",
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
        
        system_prompt = """You are Vijay, the friendly virtual manager of Taste of Hindustan in Pune. You have extensive knowledge about royal Indian and Mughlai cuisine. You are warm, professional, and always positive about Taste of Hindustan.

Restaurant Details:
- Name: Taste of Hindustan
- Location: Camp, Pune, Maharashtra 411004
- Hours: 10:00 AM - 2:00 AM (Daily)
- Phone: +91 9594287868
- Specialties: Biryani, Kebabs, Mughlai dishes
- Popular dishes: Chicken Biryani (₹380), Mutton Hindustan Special Biryani (₹650), Chicken Tandoori Mumtaz (₹495), Mutton Rogan Josh (₹450)

Guidelines:
- Always be friendly and helpful
- Recommend popular dishes when asked
- Talk positively about the food quality and service
- Keep responses concise (2-3 sentences max)
- If asked about bookings, guide them to make a reservation
- If asked about orders, guide them to order online
- Don't make up information - stick to facts about Taste of Hindustan
- Refer to yourself as "Vijay" not "Vijay Choudhary"
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
    """Get all menu items"""
    return await manager.get_menu()

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
    update_data = {k: v for k, v in menu_item.dict().items() if v is not None}
    if "variants" in update_data:
        update_data["variants"] = [v.dict() if hasattr(v, 'dict') else v for v in update_data["variants"]]
    if "addons" in update_data:
        update_data["addons"] = [a.dict() if hasattr(a, 'dict') else a for a in update_data["addons"]]
    
    success = await manager.update_menu_item_full(item_id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    return await manager.get_menu_item(item_id)

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
    return await manager.get_gallery()

@admin_router.post("/gallery")
async def admin_create_gallery_image(
    gallery_image: GalleryImageCreate,
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Add new gallery image"""
    image_data = gallery_image.dict()
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
            invoice_url = await create_order_invoice(order_id, manager)
            if invoice_url:
                update_data["invoice_url"] = invoice_url
        status_entry["note"] = f"Order accepted - KOT#{kot_num} generated"
    
    if status_update.status == "delivered":
        update_data["payment_status"] = "paid"
        status_entry["note"] = "Order delivered successfully"
        if order.get("table_number"):
            await manager.update_table_status(order.get("table_number"), "free")
    
    history = order.get("status_history", [])
    history.append(status_entry)
    update_data["status_history"] = history
    
    await manager.update_order(order_id, update_data)
    
    return await manager.get_order_by_id(order_id)

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
    
    await manager.update_order(order_id, {
        "delivery_partner_id": assignment.delivery_partner_id,
        "delivery_partner_name": partner.get("name"),
        "status_history": history
    })
    
    # Update partner internal
    current_orders = partner.get("current_orders", [])
    current_orders.append(order_id)
    for p in partners:
        if p.get("id") == assignment.delivery_partner_id or p.get("_id") == assignment.delivery_partner_id:
            p["current_orders"] = current_orders
            break
    await manager._write("delivery_partners", partners)
    
    return await manager.get_order_by_id(order_id)

# Invoice Download Endpoint
@admin_router.get("/invoice/{order_id}")
async def download_invoice(order_id: str, username: str = Depends(verify_token)):
    """Download invoice PDF"""
    invoice_path = INVOICE_DIR / f"invoice_{order_id}.pdf"
    
    if not invoice_path.exists():
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return FileResponse(
        path=str(invoice_path),
        filename=f"invoice_{order_id}.pdf",
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=invoice_{order_id}.pdf"}
    )

# Admin File Upload Endpoints
@admin_router.post("/upload/image")
async def admin_upload_image(
    file: UploadFile = File(...),
    username: str = Depends(verify_token)
):
    """Upload image file"""
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
        filename = f"img_{timestamp}_{random_suffix}.{file_extension}"
        
        file_path = UPLOAD_DIR / filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        image_url = f"/static/uploads/{filename}"
        return {"success": True, "url": image_url, "filename": filename}
    
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
        allowed_types = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        sounds_dir = ROOT_DIR / "static" / "sounds"
        sounds_dir.mkdir(parents=True, exist_ok=True)
        
        file_extension = file.filename.split(".")[-1].lower()
        filename = f"notification.{file_extension}"
        
        file_path = sounds_dir / filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        sound_url = f"/static/sounds/{filename}"
        await manager.update_setting("notification_sound", sound_url)
        return {"success": True, "url": sound_url, "message": "Notification sound updated successfully"}
    
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
        allowed_types = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        sounds_dir = ROOT_DIR / "static" / "sounds"
        sounds_dir.mkdir(parents=True, exist_ok=True)
        
        file_extension = file.filename.split(".")[-1].lower()
        filename = f"notification_dinein.{file_extension}"
        
        file_path = sounds_dir / filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        sound_url = f"/static/sounds/{filename}"
        await manager.update_setting("notification_sound_dinein", sound_url)
        return {"success": True, "url": sound_url, "message": "Dine-in notification sound updated successfully"}
    
    except Exception as e:
        logger.error(f"Sound upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    finally:
        file.file.close()
        
@admin_router.post("/upload/sound/dinein")
async def admin_upload_dinein_notification_sound(
    file: UploadFile = File(...),
    username: str = Depends(verify_token),
    manager: BaseDataManager = Depends(get_data_manager)
):
    """Upload custom dine-in notification sound"""
    try:
        allowed_types = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        sounds_dir = ROOT_DIR / "static" / "sounds"
        sounds_dir.mkdir(parents=True, exist_ok=True)
        
        file_extension = file.filename.split(".")[-1].lower()
        filename = f"notification_dinein.{file_extension}"
        
        file_path = sounds_dir / filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        sound_url = f"/static/sounds/{filename}"
        await manager.update_setting("notification_sound_dinein", sound_url)
        return {"success": True, "url": sound_url, "message": "Dine-in notification sound updated successfully"}
    
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
    for r in reservations:
        if r.get("id") == reservation_id or r.get("_id") == reservation_id:
            r["status"] = status_update.status
            r["updated_at"] = datetime.utcnow().isoformat()
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    await manager._write("reservations", reservations)
    return {"message": "Reservation status updated"}

# Admin Reviews Management
@admin_router.get("/reviews")
async def admin_get_reviews(username: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get all reviews"""
    reviews = await manager._read("reviews")
    return sorted(reviews, key=lambda x: x.get("created_at", ""), reverse=True)

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
        created_at_val = o.get("created_at")
        if isinstance(created_at_val, str):
            created_at = datetime.fromisoformat(created_at_val)
        else:
            created_at = created_at_val
        
        if start_of_day <= created_at <= end_of_day:
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
        created_at_val = order.get("created_at")
        if isinstance(created_at_val, str):
            dt = datetime.fromisoformat(created_at_val)
        else:
            dt = created_at_val
        
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
        created_at_val = o.get("created_at")
        if isinstance(created_at_val, str):
            dt = datetime.fromisoformat(created_at_val)
        else:
            dt = created_at_val
        
        if start <= dt <= end:
            orders.append(o)
            
    # Sort by created_at
    orders = sorted(orders, key=lambda x: x.get("created_at", ""))
    
    # Calculate totals
    total_sales = 0.0
    total_orders = len(orders)
    item_sales = {}
    daily_breakdown = {}
    
    for order in orders:
        order_dict = order.to_dict()
        order_date = order.created_at.strftime("%Y-%m-%d")
        
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
        order_type = order_dict.get("order_type", "takeaway")
        if order_type == "dine_in" or order_type == "dine-in":
            daily_breakdown[order_date]["dine_in"] += 1
        elif order_type == "delivery":
            daily_breakdown[order_date]["delivery"] += 1
        else:
            daily_breakdown[order_date]["takeaway"] += 1
        
        if order.status in ["delivered", "completed", "ready"]:
            total_sales += order.total
            daily_breakdown[order_date]["revenue"] += order.total
            
            # Track items
            for item in order.items or []:
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
            "kot_number": order.get("kot_number"),
            "table_number": order.get("table_number"),
            "order_type": order.get("order_type"),
            "items": [{
                "name": item.get("name"),
                "quantity": item.get("quantity"),
                "variant": item.get("variant"),
                "addons": [a.get("name") for a in item.get("addons", [])],
                "special_instructions": item.get("special_instructions")
            } for item in order.get("items", [])],
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
    """Get all tables with their status"""
    tables = await manager.get_tables()
    
    table_data = []
    for table in tables:
        table_info = {
            "table_number": table.get("table_number"),
            "capacity": table.get("capacity"),
            "status": table.get("status"),
            "current_session_id": table.get("current_session_id"),
            "current_order_id": table.get("current_order_id"),
            "current_order": None
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
    
    return await manager.create_table({
        "table_number": table.table_number,
        "capacity": table.capacity,
        "status": "free"
    })

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
    # Internal delete
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
    
    await manager.update_table_session(session_id, {
        "status": "billing",
        "subtotal": subtotal,
        "discount": discount,
        "taxes": taxes,
        "total": total
    })
    
    return {
        "session_id": session_id,
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

@delivery_router.get("/orders")
async def delivery_get_assigned_orders(phone: str = Depends(verify_token), manager: BaseDataManager = Depends(get_data_manager)):
    """Get orders assigned to delivery partner"""
    partner = await manager.get_delivery_partner_by_phone(phone)
    if not partner:
        raise HTTPException(status_code=404, detail="Delivery partner not found")
    
    orders = await manager.get_orders_by_partner(partner.get("id") or partner.get("_id"))
    active_statuses = ["accepted", "preparing", "ready", "out_for_delivery"]
    return [o for o in orders if o.get("status") in active_statuses]

@delivery_router.put("/orders/{order_id}/status")
async def delivery_update_order_status(
    order_id: str,
    new_status: str,
    phone: str = Depends(verify_token),
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
        "note": f"Status updated by delivery partner"
    })
    
    update_data = {
        "status": new_status,
        "status_history": history
    }
    
    if new_status == "delivered":
        update_data["payment_status"] = "paid"
        
        partner = await manager.get_delivery_partner_by_phone(phone)
        if partner:
            current_orders = partner.get("current_orders", [])
            new_current_orders = [o for o in current_orders if o != order_id]
            # Internal update for partner
            partners = await manager._read("delivery_partners")
            for p in partners:
                if p.get("phone") == phone:
                    p["current_orders"] = new_current_orders
                    p["total_deliveries"] = p.get("total_deliveries", 0) + 1
                    break
            await manager._write("delivery_partners", partners)
    
    await manager.update_order(order_id, update_data)
    
    return await manager.get_order_by_id(order_id)

# =============================================================================
# STARTUP AND SHUTDOWN EVENTS
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    db_mode = os.environ.get("DB_MODE", "POSTGRES")
    if db_mode == "POSTGRES":
        logger.info("Initializing PostgreSQL database...")
        await init_db()
        await seed_database()
        logger.info("PostgreSQL database initialized successfully")
    else:
        logger.info(f"Running in {db_mode} mode. Bypassing PostgreSQL initialization.")
        # MockFirebaseManager handles its own seeding in __init__

@app.on_event("shutdown")
async def shutdown_event():
    """Close database on shutdown"""
    if os.environ.get("DB_MODE") == "POSTGRES":
        await close_db()
        logger.info("Database connection closed")

# =============================================================================
# CORS AND ROUTERS
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(admin_router)
app.include_router(delivery_router)

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
