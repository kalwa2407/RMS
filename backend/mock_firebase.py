import json
import os
import uuid
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path
from data_manager import BaseDataManager

logger = logging.getLogger(__name__)

class MockFirebaseManager(BaseDataManager):
    def __init__(self):
        self.db_path = Path(__file__).parent / "db_mock"
        self.db_path.mkdir(exist_ok=True)
        self._ensure_files()

    def _ensure_files(self):
        collections = [
            "menu_items", "orders", "tables", "reservations", 
            "reviews", "admin_users", "settings", "coupons", 
            "delivery_partners", "inventory", "table_sessions"
        ]
        for col in collections:
            file_path = self.db_path / f"{col}.json"
            if not file_path.exists():
                with open(file_path, "w") as f:
                    json.dump([], f)
        
        # Self-seed if empty
        self._seed_if_empty()

    def _seed_if_empty(self):
        # Admin User
        admins = self._read_sync("admin_users")
        if not admins:
            from auth import get_password_hash
            self._write_sync("admin_users", [{
                "_id": str(uuid.uuid4()),
                "username": "Vijay@Tasteofhindustan",
                "password": get_password_hash("Vijay@123"),
                "created_at": datetime.utcnow().isoformat()
            }])

        # Menu Items
        menu = self._read_sync("menu_items")
        if not menu:
            mock_menu = [
                {"name": "Chicken Biryani", "category": "Main Course", "description": "Aromatic basmati rice with tender chicken", "price": 350.0, "popular": True, "veg": False, "spicy_level": 2, "preparation_time": 25, "available": True},
                {"name": "Paneer Tikka", "category": "Starters", "description": "Grilled cottage cheese with spices", "price": 280.0, "popular": True, "veg": True, "spicy_level": 1, "preparation_time": 15, "available": True},
                {"name": "Mutton Kebab", "category": "Starters", "description": "Juicy minced mutton kebabs", "price": 420.0, "popular": False, "veg": False, "spicy_level": 2, "preparation_time": 20, "available": True},
                {"name": "Dal Makhani", "category": "Main Course", "description": "Creamy black lentils", "price": 220.0, "popular": True, "veg": True, "spicy_level": 0, "preparation_time": 15, "available": True},
                {"name": "Butter Naan", "category": "Breads", "description": "Soft buttered flatbread", "price": 60.0, "popular": True, "veg": True, "spicy_level": 0, "preparation_time": 10, "available": True},
            ]
            for item in mock_menu:
                item["_id"] = str(uuid.uuid4())
                item["created_at"] = datetime.utcnow().isoformat()
            self._write_sync("menu_items", mock_menu)

        # Tables
        tables = self._read_sync("tables")
        if not tables:
            mock_tables = []
            for i in range(1, 45):
                mock_tables.append({
                    "_id": str(uuid.uuid4()),
                    "table_number": i,
                    "capacity": 4,
                    "status": "free",
                    "created_at": datetime.utcnow().isoformat()
                })
            self._write_sync("tables", mock_tables)

        # Settings
        settings = self._read_sync("settings")
        if not settings:
            mock_settings = [
                {"key": "contact_address", "value": "Upper Ground Floor, Renaissance Business Wellesley Road, Camp Area, Pune"},
                {"key": "contact_phone", "value": "+91 91756 23047"},
                {"key": "contact_email", "value": "info@tasteofhindustan.com"},
                {"key": "opening_hours", "value": "11:00 AM - 11:00 PM"}
            ]
            for s in mock_settings:
                s["_id"] = str(uuid.uuid4())
            self._write_sync("settings", mock_settings)

    def _read_sync(self, collection: str) -> List[Dict[str, Any]]:
        file_path = self.db_path / f"{collection}.json"
        try:
            with open(file_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading {collection}: {e}")
            return []

    def _write_sync(self, collection: str, data: List[Dict[str, Any]]):
        file_path = self.db_path / f"{collection}.json"
        try:
            with open(file_path, "w") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            logger.error(f"Error writing {collection}: {e}")

    async def _read(self, collection: str) -> List[Dict[str, Any]]:
        file_path = self.db_path / f"{collection}.json"
        try:
            with open(file_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading {collection}: {e}")
            return []

    async def _write(self, collection: str, data: List[Dict[str, Any]]):
        file_path = self.db_path / f"{collection}.json"
        try:
            with open(file_path, "w") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            logger.error(f"Error writing {collection}: {e}")

    async def get_menu(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        menu = self._read_sync("menu_items")
        menu = [item for item in menu if item.get("available", True)]
        if category and category != "All":
            menu = [item for item in menu if item.get("category") == category]
        return menu

    async def get_menu_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        menu = self._read_sync("menu_items")
        for item in menu:
            if item.get("_id") == item_id:
                return item
        return None

    async def get_menu_categories(self) -> List[str]:
        menu = self._read_sync("menu_items")
        return list(set(item.get("category") for item in menu if item.get("available", True)))

    async def get_tables(self) -> List[Dict[str, Any]]:
        return sorted(self._read_sync("tables"), key=lambda x: x.get("table_number", 0))

    async def get_table(self, table_number: int) -> Optional[Dict[str, Any]]:
        tables = self._read_sync("tables")
        for t in tables:
            if t.get("table_number") == table_number:
                return t
        return None

    async def update_table_status(self, table_number: int, status: str, order_id: Optional[str] = None) -> bool:
        tables = self._read_sync("tables")
        updated = False
        for t in tables:
            if t.get("table_number") == table_number:
                t["status"] = status
                t["current_order_id"] = order_id
                updated = True
                break
        if updated:
            self._write_sync("tables", tables)
        return updated

    async def get_gallery(self) -> List[Dict[str, Any]]:
        return self._read_sync("gallery_images")

    async def get_reviews(self) -> List[Dict[str, Any]]:
        return sorted(self._read_sync("reviews"), key=lambda x: x.get("created_at", ""), reverse=True)

    async def get_settings(self) -> Dict[str, Any]:
        settings_list = self._read_sync("settings")
        return {s["key"]: s["value"] for s in settings_list}

    async def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        orders = self._read_sync("orders")
        order_data["_id"] = str(uuid.uuid4())
        order_data["created_at"] = datetime.utcnow().isoformat()
        orders.append(order_data)
        self._write_sync("orders", orders)
        return order_data

    async def get_order_by_id(self, order_id: str) -> Optional[Dict[str, Any]]:
        orders = self._read_sync("orders")
        for o in orders:
            if o.get("order_id") == order_id:
                return o
        return None

    async def update_order_status(self, order_id: str, status: str, history_entry: Dict[str, Any]) -> bool:
        orders = self._read_sync("orders")
        updated = False
        for o in orders:
            if o.get("order_id") == order_id:
                o["status"] = status
                if "status_history" not in o:
                    o["status_history"] = []
                o["status_history"].append(history_entry)
                updated = True
                break
        if updated:
            self._write_sync("orders", orders)
        return updated

    async def update_order(self, order_id: str, update_data: Dict[str, Any]) -> bool:
        orders = self._read_sync("orders")
        updated = False
        for o in orders:
            if o.get("order_id") == order_id:
                o.update(update_data)
                o["updated_at"] = datetime.utcnow().isoformat()
                updated = True
                break
        if updated:
            self._write_sync("orders", orders)
        return updated

    async def validate_coupon(self, code: str) -> Optional[Dict[str, Any]]:
        coupons = self._read_sync("coupons")
        for c in coupons:
            if c.get("code") == code.upper() and c.get("active", True):
                return c
        return None

    async def create_reservation(self, reservation_data: Dict[str, Any]) -> Dict[str, Any]:
        res = self._read_sync("reservations")
        reservation_data["_id"] = str(uuid.uuid4())
        reservation_data["created_at"] = datetime.utcnow().isoformat()
        res.append(reservation_data)
        self._write_sync("reservations", res)
        return reservation_data

    async def get_admin_user(self, username: str) -> Optional[Dict[str, Any]]:
        admins = self._read_sync("admin_users")
        for a in admins:
            if a.get("username") == username:
                return a
        return None

    async def get_delivery_partner_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        partners = self._read_sync("delivery_partners")
        for p in partners:
            if p.get("phone") == phone:
                return p
        return None

    async def get_orders_by_partner(self, partner_id: str) -> List[Dict[str, Any]]:
        orders = self._read_sync("orders")
        return [o for o in orders if o.get("delivery_partner_id") == partner_id]

    async def get_table_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        sessions = self._read_sync("table_sessions")
        for s in sessions:
            if s.get("session_id") == session_id:
                return s
        return None

    async def create_table_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        sessions = self._read_sync("table_sessions")
        session_data["_id"] = str(uuid.uuid4())
        session_data["created_at"] = datetime.utcnow().isoformat()
        sessions.append(session_data)
        self._write_sync("table_sessions", sessions)
        return session_data

    async def update_table_session(self, session_id: str, update_data: Dict[str, Any]) -> bool:
        sessions = self._read_sync("table_sessions")
        updated = False
        for s in sessions:
            if s.get("session_id") == session_id:
                s.update(update_data)
                s["updated_at"] = datetime.utcnow().isoformat()
                updated = True
                break
        if updated:
            self._write_sync("table_sessions", sessions)
        return updated

    async def get_inventory(self) -> List[Dict[str, Any]]:
        return self._read_sync("inventory")

    async def get_inventory_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        inventory = self._read_sync("inventory")
        for item in inventory:
            if item.get("_id") == item_id or item.get("id") == item_id:
                return item
        return None

    async def update_inventory_item(self, item_id: str, update_data: Dict[str, Any]) -> bool:
        inventory = self._read_sync("inventory")
        updated = False
        for item in inventory:
            if item.get("_id") == item_id or item.get("id") == item_id:
                item.update(update_data)
                item["updated_at"] = datetime.utcnow().isoformat()
                updated = True
                break
        if updated:
            self._write_sync("inventory", inventory)
        return updated

    async def create_inventory_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        inventory = self._read_sync("inventory")
        if "_id" not in item_data:
            item_data["_id"] = str(uuid.uuid4())
        item_data["created_at"] = datetime.utcnow().isoformat()
        inventory.append(item_data)
        self._write_sync("inventory", inventory)
        return item_data

    async def get_all_orders(self, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        orders = self._read_sync("orders")
        if status_filter and status_filter != "all":
            orders = [o for o in orders if o.get("status") == status_filter]
        return sorted(orders, key=lambda x: x.get("created_at", ""), reverse=True)

    async def create_menu_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        menu = self._read_sync("menu_items")
        item_data["_id"] = str(uuid.uuid4())
        item_data["created_at"] = datetime.utcnow().isoformat()
        menu.append(item_data)
        self._write_sync("menu_items", menu)
        return item_data

    async def update_menu_item_full(self, item_id: str, update_data: Dict[str, Any]) -> bool:
        menu = self._read_sync("menu_items")
        updated = False
        for item in menu:
            if item.get("_id") == item_id:
                item.update(update_data)
                item["updated_at"] = datetime.utcnow().isoformat()
                updated = True
                break
        if updated:
            self._write_sync("menu_items", menu)
        return updated

    async def delete_menu_item(self, item_id: str) -> bool:
        menu = self._read_sync("menu_items")
        new_menu = [i for i in menu if i.get("_id") != item_id]
        if len(new_menu) == len(menu):
            return False
        self._write_sync("menu_items", new_menu)
        return True

    async def create_gallery_image(self, image_data: Dict[str, Any]) -> Dict[str, Any]:
        gallery = self._read_sync("gallery_images")
        image_data["_id"] = str(uuid.uuid4())
        image_data["created_at"] = datetime.utcnow().isoformat()
        gallery.append(image_data)
        self._write_sync("gallery_images", gallery)
        return image_data

    async def delete_gallery_image(self, image_id: str) -> bool:
        gallery = self._read_sync("gallery_images")
        new_gallery = [img for img in gallery if img.get("_id") != image_id]
        if len(new_gallery) == len(gallery):
            return False
        self._write_sync("gallery_images", new_gallery)
        return True

    async def get_setting(self, key: str) -> Optional[str]:
        settings = self._read_sync("settings")
        for s in settings:
            if s.get("key") == key:
                return s.get("value")
        return None

    async def update_setting(self, key: str, value: str) -> bool:
        settings = self._read_sync("settings")
        updated = False
        for s in settings:
            if s.get("key") == key:
                s["value"] = value
                s["updated_at"] = datetime.utcnow().isoformat()
                updated = True
                break
        if not updated:
            settings.append({
                "key": key,
                "value": value,
                "updated_at": datetime.utcnow().isoformat()
            })
        self._write_sync("settings", settings)
        return True
