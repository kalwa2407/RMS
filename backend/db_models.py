"""SQLAlchemy Models for PostgreSQL"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, default="")
    price = Column(Float, nullable=False)
    image = Column(String(500), default="")
    popular = Column(Boolean, default=False)
    available = Column(Boolean, default=True)
    variants = Column(JSON, default=list)  # List of {name, price}
    addons = Column(JSON, default=list)  # List of {name, price}
    veg = Column(Boolean, default=True)
    spicy_level = Column(Integer, default=0)
    preparation_time = Column(Integer, default=15)
    stock_quantity = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "price": self.price,
            "image": self.image,
            "popular": self.popular,
            "available": self.available,
            "variants": self.variants or [],
            "addons": self.addons or [],
            "veg": self.veg,
            "spicy_level": self.spicy_level,
            "preparation_time": self.preparation_time,
            "stock_quantity": self.stock_quantity,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class GalleryImage(Base):
    __tablename__ = "gallery_images"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    image_url = Column(String(500), nullable=False)
    caption = Column(String(500), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "image_url": self.image_url,
            "caption": self.caption,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    order_id = Column(String(50), unique=True, nullable=False, index=True)
    session_id = Column(String(50), nullable=True, index=True)
    customer_name = Column(String(255), nullable=False)
    phone = Column(String(20), default="")
    email = Column(String(255), nullable=True)
    address = Column(Text, default="")
    distance_km = Column(Float, nullable=True)
    items = Column(JSON, nullable=False)  # List of order items
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    delivery_fee = Column(Float, default=0.0)
    taxes = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    coupon_code = Column(String(50), nullable=True)
    payment_method = Column(String(50), default="cod")
    payment_status = Column(String(20), default="pending")
    status = Column(String(30), default="placed", index=True)
    cancellation_reason = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    delay_time = Column(Integer, nullable=True)
    delivery_partner_id = Column(String(100), nullable=True)
    delivery_partner_name = Column(String(255), nullable=True)
    estimated_delivery_time = Column(DateTime, nullable=True)
    invoice_url = Column(String(500), nullable=True)
    status_history = Column(JSON, default=list)
    order_type = Column(String(20), default="DELIVERY")
    table_number = Column(Integer, nullable=True)
    kot_number = Column(String(50), nullable=True)
    special_instructions = Column(Text, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "order_id": self.order_id,
            "session_id": self.session_id,
            "customer_name": self.customer_name,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "distance_km": self.distance_km,
            "items": self.items or [],
            "subtotal": self.subtotal,
            "discount": self.discount,
            "delivery_fee": self.delivery_fee,
            "taxes": self.taxes,
            "total": self.total,
            "coupon_code": self.coupon_code,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "status": self.status,
            "cancellation_reason": self.cancellation_reason,
            "rejection_reason": self.rejection_reason,
            "delay_time": self.delay_time,
            "delivery_partner_id": self.delivery_partner_id,
            "delivery_partner_name": self.delivery_partner_name,
            "estimated_delivery_time": self.estimated_delivery_time.isoformat() if self.estimated_delivery_time else None,
            "invoice_url": self.invoice_url,
            "status_history": self.status_history or [],
            "order_type": self.order_type,
            "table_number": self.table_number,
            "kot_number": self.kot_number,
            "special_instructions": self.special_instructions,
            "accepted_at": self.accepted_at.isoformat() if self.accepted_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Table(Base):
    __tablename__ = "tables"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    table_number = Column(Integer, unique=True, nullable=False)
    capacity = Column(Integer, default=4)
    status = Column(String(20), default="free")
    current_order_id = Column(String(50), nullable=True)
    current_session_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "table_number": self.table_number,
            "capacity": self.capacity,
            "status": self.status,
            "current_order_id": self.current_order_id,
            "current_session_id": self.current_session_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class TableSession(Base):
    __tablename__ = "table_sessions"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    session_id = Column(String(50), unique=True, nullable=False, index=True)
    table_number = Column(Integer, nullable=False)
    customer_name = Column(String(255), nullable=False)
    status = Column(String(20), default="pending")
    order_ids = Column(JSON, default=list)
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    taxes = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    payment_method = Column(String(50), nullable=True)
    payment_status = Column(String(20), default="pending")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "session_id": self.session_id,
            "table_number": self.table_number,
            "customer_name": self.customer_name,
            "status": self.status,
            "order_ids": self.order_ids or [],
            "subtotal": self.subtotal,
            "discount": self.discount,
            "taxes": self.taxes,
            "total": self.total,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None
        }


class Reservation(Base):
    __tablename__ = "reservations"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    customer_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    date = Column(String(20), nullable=False)
    time = Column(String(20), nullable=False)
    guests = Column(Integer, nullable=False)
    special_requests = Column(Text, nullable=True)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "customer_name": self.customer_name,
            "phone": self.phone,
            "email": self.email,
            "date": self.date,
            "time": self.time,
            "guests": self.guests,
            "special_requests": self.special_requests,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    customer_name = Column(String(255), nullable=False)
    rating = Column(Integer, nullable=False)
    review_text = Column(Text, default="")
    date = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "customer_name": self.customer_name,
            "rating": self.rating,
            "review_text": self.review_text,
            "date": self.date,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    username = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "username": self.username,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Setting(Base):
    __tablename__ = "settings"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "key": self.key,
            "value": self.value,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Coupon(Base):
    __tablename__ = "coupons"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False)
    discount_type = Column(String(20), nullable=False)
    discount_value = Column(Float, nullable=False)
    min_order_value = Column(Float, default=0.0)
    max_discount = Column(Float, nullable=True)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "code": self.code,
            "discount_type": self.discount_type,
            "discount_value": self.discount_value,
            "min_order_value": self.min_order_value,
            "max_discount": self.max_discount,
            "valid_from": self.valid_from.isoformat() if self.valid_from else None,
            "valid_until": self.valid_until.isoformat() if self.valid_until else None,
            "usage_limit": self.usage_limit,
            "used_count": self.used_count,
            "active": self.active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class DeliveryPartner(Base):
    __tablename__ = "delivery_partners"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(255), nullable=True)
    vehicle_type = Column(String(50), nullable=False)
    vehicle_number = Column(String(50), nullable=False)
    password = Column(String(255), nullable=False)
    active = Column(Boolean, default=True)
    current_orders = Column(JSON, default=list)
    total_deliveries = Column(Integer, default=0)
    rating = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "vehicle_type": self.vehicle_type,
            "vehicle_number": self.vehicle_number,
            "active": self.active,
            "current_orders": self.current_orders or [],
            "total_deliveries": self.total_deliveries,
            "rating": self.rating,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Other")
    unit = Column(String(20), default="kg")
    current_stock = Column(Float, default=0)
    min_stock = Column(Float, default=5)
    cost_per_unit = Column(Float, default=0)
    supplier = Column(String(255), default="")
    history = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "_id": self.id,
            "name": self.name,
            "category": self.category,
            "unit": self.unit,
            "current_stock": self.current_stock,
            "min_stock": self.min_stock,
            "cost_per_unit": self.cost_per_unit,
            "supplier": self.supplier,
            "history": self.history or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
