from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

# Variant and Add-on Models
class MenuVariant(BaseModel):
    name: str  # e.g., "Small", "Medium", "Large"
    price: float  # Additional price or base price

class MenuAddon(BaseModel):
    name: str  # e.g., "Extra Cheese", "Extra Spicy"
    price: float  # Additional price

# Menu Item Models
class MenuItem(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    category: str
    description: str
    price: float  # Base price
    image: str
    popular: bool = False
    available: bool = True
    variants: List[MenuVariant] = []  # Size variations
    addons: List[MenuAddon] = []  # Extra items/toppings
    veg: bool = True  # Vegetarian flag
    spicy_level: int = 0  # 0-3 (Mild to Very Spicy)
    preparation_time: int = 15  # Minutes
    stock_quantity: Optional[int] = None  # None means unlimited
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MenuItemCreate(BaseModel):
    name: str
    category: str
    description: str
    price: float
    image: str
    popular: bool = False
    available: bool = True
    variants: List[MenuVariant] = []
    addons: List[MenuAddon] = []
    veg: bool = True
    spicy_level: int = 0
    preparation_time: int = 15
    stock_quantity: Optional[int] = None

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    popular: Optional[bool] = None
    available: Optional[bool] = None
    variants: Optional[List[MenuVariant]] = None
    addons: Optional[List[MenuAddon]] = None
    veg: Optional[bool] = None
    spicy_level: Optional[int] = None
    preparation_time: Optional[int] = None
    stock_quantity: Optional[int] = None

# Gallery Models
class GalleryImage(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    image_url: str
    caption: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class GalleryImageCreate(BaseModel):
    image_url: str
    caption: str

# Order Models
class OrderItemAddon(BaseModel):
    name: str
    price: float

class OrderItem(BaseModel):
    item_id: str
    name: str
    price: float  # Base price
    quantity: int
    variant: Optional[str] = None  # Selected variant name
    variant_price: float = 0.0  # Additional variant price
    addons: List[OrderItemAddon] = []  # Selected addons
    special_instructions: Optional[str] = None
    item_cost: float = 0.0  # Cost price for profit calculation

class Order(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    order_id: str  # Human-readable order ID like ORD12345
    customer_name: str
    phone: str
    email: Optional[str] = None
    address: str
    distance_km: Optional[float] = None  # Distance from restaurant in km
    items: List[OrderItem]
    subtotal: float
    discount: float = 0.0
    delivery_fee: float = 0.0
    taxes: float = 0.0
    total: float
    coupon_code: Optional[str] = None
    payment_method: str  # 'cod', 'upi', 'online', 'pay_at_counter'
    payment_status: str = "pending"  # 'pending', 'paid', 'failed'
    status: str = "placed"  # 'placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'
    cancellation_reason: Optional[str] = None
    rejection_reason: Optional[str] = None
    delay_time: Optional[int] = None  # Minutes
    delivery_partner_id: Optional[str] = None
    delivery_partner_name: Optional[str] = None
    estimated_delivery_time: Optional[datetime] = None
    invoice_url: Optional[str] = None
    status_history: List[dict] = []  # Track status changes with timestamp
    # Dine-in / Table ordering fields
    order_type: str = "DELIVERY"  # 'DELIVERY', 'TAKEAWAY', 'DINE_IN'
    table_number: Optional[int] = None  # Table number for dine-in
    kot_number: Optional[str] = None  # Kitchen Order Ticket number
    accepted_at: Optional[datetime] = None  # When order was accepted
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class OrderCreate(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = None
    address: str = ""  # Optional for dine-in
    distance_km: Optional[float] = None  # Distance from restaurant in km
    items: List[OrderItem]
    subtotal: float
    discount: float = 0.0
    delivery_fee: float = 0.0
    taxes: float = 0.0
    total: float
    coupon_code: Optional[str] = None
    payment_method: str = "pay_at_counter"
    # Dine-in fields
    order_type: str = "DELIVERY"  # 'DELIVERY', 'TAKEAWAY', 'DINE_IN'
    table_number: Optional[int] = None  # Table number for dine-in

# Table Order Create (simplified for QR ordering)
class TableOrderCreate(BaseModel):
    customer_name: str = "Guest"
    phone: str = ""
    table_number: int
    items: List[OrderItem]
    subtotal: float
    taxes: float = 0.0
    total: float
    special_instructions: Optional[str] = None

# Table Management Model
class Table(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    table_number: int
    capacity: int = 4
    status: str = "free"  # 'free', 'occupied', 'reserved'
    current_order_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class TableCreate(BaseModel):
    table_number: int
    capacity: int = 4

class TableStatusUpdate(BaseModel):
    status: str  # 'free', 'occupied', 'reserved'

class OrderStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None  # For rejection/cancellation
    delay_time: Optional[int] = None  # For delay

class OrderCancellationRequest(BaseModel):
    reason: str

# Reservation Models
class Reservation(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    customer_name: str
    phone: str
    email: Optional[str] = None
    date: str
    time: str
    guests: int
    special_requests: Optional[str] = None
    status: str = "pending"  # 'pending', 'confirmed', 'rejected'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ReservationCreate(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = None
    date: str
    time: str
    guests: int
    special_requests: Optional[str] = None

class ReservationStatusUpdate(BaseModel):
    status: str

# Review Models
class Review(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    customer_name: str
    rating: int
    review_text: str
    date: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ReviewCreate(BaseModel):
    customer_name: str
    rating: int
    review_text: str
    date: str

# Admin Models
class AdminUser(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    username: str
    password: str  # Hashed
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminPasswordChange(BaseModel):
    old_password: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Settings Models
class Setting(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    key: str
    value: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SettingUpdate(BaseModel):
    key: str
    value: str

# Coupon Models
class Coupon(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    code: str
    discount_type: str  # 'percentage' or 'fixed'
    discount_value: float
    min_order_value: float = 0.0
    max_discount: Optional[float] = None  # For percentage type
    valid_from: datetime
    valid_until: datetime
    usage_limit: Optional[int] = None  # Total usage limit
    used_count: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class CouponCreate(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    min_order_value: float = 0.0
    max_discount: Optional[float] = None
    valid_from: datetime
    valid_until: datetime
    usage_limit: Optional[int] = None
    active: bool = True

class CouponUpdate(BaseModel):
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_order_value: Optional[float] = None
    max_discount: Optional[float] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    usage_limit: Optional[int] = None
    active: Optional[bool] = None

class CouponValidation(BaseModel):
    code: str
    order_value: float

# Delivery Partner Models
class DeliveryPartner(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    phone: str
    email: Optional[str] = None
    vehicle_type: str  # 'bike', 'car', 'bicycle'
    vehicle_number: str
    password: str  # Hashed
    active: bool = True
    current_orders: List[str] = []  # List of order IDs
    total_deliveries: int = 0
    rating: float = 5.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DeliveryPartnerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    vehicle_type: str
    vehicle_number: str
    password: str

class DeliveryPartnerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    active: Optional[bool] = None

class DeliveryPartnerLogin(BaseModel):
    phone: str
    password: str

class OrderAssignment(BaseModel):
    delivery_partner_id: str

# Analytics Models
class SalesAnalytics(BaseModel):
    total_sales: float
    total_orders: int
    completed_orders: int
    cancelled_orders: int
    pending_orders: int
    total_refunds: float
    today_revenue: float
    today_orders: int
    best_selling_items: List[dict]
    revenue_by_date: List[dict]

# Chatbot Models
class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# =============================================================================
# TABLE SESSION MODELS (PetPooja-Style)
# =============================================================================

class TableSession(BaseModel):
    """A table session groups multiple orders under one bill"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    session_id: str  # Unique session ID like SES20231223001
    table_number: int
    customer_name: str
    status: str = "pending"  # 'pending', 'active', 'billing', 'closed'
    order_ids: List[str] = []  # List of order_ids in this session
    subtotal: float = 0.0
    discount: float = 0.0
    taxes: float = 0.0
    total: float = 0.0
    payment_method: Optional[str] = None
    payment_status: str = "pending"  # 'pending', 'paid'
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class TableSessionCreate(BaseModel):
    table_number: int
    customer_name: str

class TableSessionOrderCreate(BaseModel):
    """Add order to existing session"""
    session_id: str
    items: List[OrderItem]
    special_instructions: Optional[str] = None

class TableSessionBillGenerate(BaseModel):
    """Generate final bill for session"""
    session_id: str
    discount: float = 0.0
    payment_method: str = "cash"  # 'cash', 'card', 'upi'

class DineInOrderCreate(BaseModel):
    """Create new dine-in order (starts or adds to session)"""
    table_number: int
    customer_name: str
    items: List[OrderItem]
    session_id: Optional[str] = None  # If provided, adds to existing session
    special_instructions: Optional[str] = None
