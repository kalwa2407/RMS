import os
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class BaseDataManager(ABC):
    @abstractmethod
    async def get_menu(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_menu_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_menu_categories(self) -> List[str]:
        pass

    @abstractmethod
    async def get_tables(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_table(self, table_number: int) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def update_table_status(self, table_number: int, status: str, order_id: Optional[str] = None) -> bool:
        pass

    @abstractmethod
    async def get_gallery(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_reviews(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_settings(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_order_by_id(self, order_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def update_order_status(self, order_id: str, status: str, history_entry: Dict[str, Any]) -> bool:
        pass

    @abstractmethod
    async def update_order(self, order_id: str, update_data: Dict[str, Any]) -> bool:
        pass

    @abstractmethod
    async def validate_coupon(self, code: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create_reservation(self, reservation_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_admin_user(self, username: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_delivery_partner_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_orders_by_partner(self, partner_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_table_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create_table_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def update_table_session(self, session_id: str, update_data: Dict[str, Any]) -> bool:
        pass

    @abstractmethod
    async def get_inventory(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_inventory_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def update_inventory_item(self, item_id: str, update_data: Dict[str, Any]) -> bool:
        pass

    @abstractmethod
    async def get_all_orders(self, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create_menu_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def update_menu_item_full(self, item_id: str, update_data: Dict[str, Any]) -> bool:
        pass

    @abstractmethod
    async def delete_menu_item(self, item_id: str) -> bool:
        pass

    @abstractmethod
    async def create_gallery_image(self, image_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_setting(self, key: str) -> Optional[str]:
        pass

    @abstractmethod
    async def update_setting(self, key: str, value: str) -> bool:
        pass

def get_data_manager() -> BaseDataManager:
    db_mode = os.environ.get("DB_MODE", "FIREBASE")
    
    if db_mode == "MOCK_FIREBASE":
        from mock_firebase import MockFirebaseManager
        return MockFirebaseManager()
    elif db_mode == "FIREBASE":
        from firebase_manager import FirebaseManager
        return FirebaseManager()
    else:
        # Fallback to MockFirebase if postgres isn't actually ready
        from mock_firebase import MockFirebaseManager
        return MockFirebaseManager()
