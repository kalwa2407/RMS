import os
import uuid
import logging
import time
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path
from data_manager import BaseDataManager

# ---------------------------------------------------------------------------
# Simple in-memory TTL cache -- eliminates repeat Firestore round-trips.
# A single process-level instance is shared across all requests.
# ---------------------------------------------------------------------------
class _SimpleCache:
    """Lightweight dict-based TTL cache. No external dependencies."""
    def __init__(self):
        self._store: dict = {}   # key ? (value, expires_at)

    def get(self, key: str):
        entry = self._store.get(key)
        if entry and time.monotonic() < entry[1]:
            return entry[0]          # cache HIT
        self._store.pop(key, None)   # expired -- remove
        return None                  # cache MISS

    def set(self, key: str, value, ttl_seconds: int):
        self._store[key] = (value, time.monotonic() + ttl_seconds)

    def invalidate(self, *keys: str):
        for k in keys:
            self._store.pop(k, None)

    def clear(self):
        self._store.clear()

# One shared cache instance for the whole process
_menu_cache = _SimpleCache()

# TTL constants (seconds)
_TTL_MENU_PUBLIC     = 300   # 5 min  -- public menu changes rarely during service
_TTL_MENU_ADMIN      = 30    # 30 sec -- admin needs near-real-time view
_TTL_CATEGORIES      = 300   # 5 min
_TTL_REVIEWS         = 120   # 2 min
_TTL_GALLERY         = 600   # 10 min

# Keys
_KEY_MENU_PUBLIC  = "menu_public"
_KEY_MENU_ADMIN   = "menu_admin"
_KEY_CATEGORIES   = "menu_categories"
_KEY_REVIEWS      = "reviews"
_KEY_GALLERY      = "gallery"

def _invalidate_menu_cache():
    """Call this after any menu write (create / update / delete / toggle)."""
    _menu_cache.invalidate(_KEY_MENU_PUBLIC, _KEY_MENU_ADMIN, _KEY_CATEGORIES)

import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger(__name__)

class FirebaseManager(BaseDataManager):
    def __init__(self):
        try:
            if not firebase_admin._apps:
                cred_env = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
                if cred_env:
                    import json
                    cred_dict = json.loads(cred_env)
                    cred = credentials.Certificate(cred_dict)
                else:
                    cred_path = os.environ.get("FIREBASE_CREDENTIALS", "firebase_credentials.json")
                    cred_file = Path(__file__).parent / cred_path
                    cred = credentials.Certificate(str(cred_file))
                
                storage_bucket = os.environ.get("FIREBASE_STORAGE_BUCKET", "tasteofhindustanrms.firebasestorage.app")
                firebase_admin.initialize_app(cred, {"storageBucket": storage_bucket})
            self.db = firestore.client()
        except Exception as e:
            logger.error(f"Error initializing Firebase Admin: {e}")
            raise e

    # Compatibility methods for server.py fast-built endpoints
    async def _read(self, collection: str) -> List[Dict[str, Any]]:
        docs = self.db.collection(collection).stream()
        return [doc.to_dict() for doc in docs]

    async def _write(self, collection: str, data: List[Dict[str, Any]]):
        # Invalidate cache for affected collection
        if collection == "reviews":
            _menu_cache.invalidate(_KEY_REVIEWS)
        elif collection == "menu_items":
            _invalidate_menu_cache()
        elif collection == "gallery_images":
            _menu_cache.invalidate(_KEY_GALLERY)
        # A hacky but effective way to emulate JSON array replacement in Firestore
        # 1. Fetch current docs
        existing_docs = self.db.collection(collection).stream()
        existing_ids = {doc.id for doc in existing_docs}
        
        # 2. Add/Update new docs
        batch = self.db.batch()
        new_ids = set()
        
        operations = 0
        for item in data:
            doc_id = item.get("_id") or item.get("id") or item.get("order_id") or item.get("session_id") or str(uuid.uuid4())
            item["_id"] = doc_id
            doc_ref = self.db.collection(collection).document(doc_id)
            batch.set(doc_ref, item)
            new_ids.add(doc_id)
            operations += 1
            
            if operations % 400 == 0:
                batch.commit()
                batch = self.db.batch()
                operations = 0
                
        # 3. Delete docs that are no longer in data
        docs_to_delete = existing_ids - new_ids
        for doc_id in docs_to_delete:
            doc_ref = self.db.collection(collection).document(doc_id)
            batch.delete(doc_ref)
            operations += 1
            if operations % 400 == 0:
                batch.commit()
                batch = self.db.batch()
                operations = 0
                
        if operations > 0:
            batch.commit()
            
        return True

    async def get_menu(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        cached = _menu_cache.get(_KEY_MENU_PUBLIC)
        if cached is None:
            logger.debug("Cache MISS: menu_public -- fetching from Firestore")
            menu_ref = self.db.collection('menu_items')
            docs = menu_ref.where('available', '==', True).stream()
            cached = [doc.to_dict() for doc in docs]
            _menu_cache.set(_KEY_MENU_PUBLIC, cached, _TTL_MENU_PUBLIC)
        else:
            logger.debug("Cache HIT: menu_public")
        if category and category != "All":
            return [item for item in cached if item.get("category") == category]
        return cached

    async def get_all_menu_items(self) -> List[Dict[str, Any]]:
        """Get ALL menu items including unavailable (for admin panel)"""
        cached = _menu_cache.get(_KEY_MENU_ADMIN)
        if cached is None:
            logger.debug("Cache MISS: menu_admin -- fetching from Firestore")
            docs = self.db.collection('menu_items').stream()
            cached = [doc.to_dict() for doc in docs]
            _menu_cache.set(_KEY_MENU_ADMIN, cached, _TTL_MENU_ADMIN)
        else:
            logger.debug("Cache HIT: menu_admin")
        return cached

    async def get_menu_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        doc = self.db.collection('menu_items').document(item_id).get()
        return doc.to_dict() if doc.exists else None

    async def get_menu_categories(self) -> List[str]:
        cached = _menu_cache.get(_KEY_CATEGORIES)
        if cached is None:
            logger.debug("Cache MISS: menu_categories -- deriving from menu_public cache")
            # Re-use the public menu cache to avoid a separate Firestore read
            menu = await self.get_menu()   # will HIT cache if already loaded
            cached = sorted(list(set(item.get("category") for item in menu if item.get("category"))))
            _menu_cache.set(_KEY_CATEGORIES, cached, _TTL_CATEGORIES)
        else:
            logger.debug("Cache HIT: menu_categories")
        return cached

    async def get_tables(self) -> List[Dict[str, Any]]:
        docs = self.db.collection('tables').stream()
        tables = [doc.to_dict() for doc in docs]
        return sorted(tables, key=lambda x: x.get("table_number", 0))

    async def get_table(self, table_number: int) -> Optional[Dict[str, Any]]:
        docs = self.db.collection('tables').where('table_number', '==', table_number).stream()
        for doc in docs:
            return doc.to_dict()
        return None

    async def update_table_status(self, table_number: int, status: str, order_id: Optional[str] = None) -> bool:
        docs = self.db.collection('tables').where('table_number', '==', table_number).stream()
        for doc in docs:
            doc.reference.update({
                'status': status,
                'current_order_id': order_id
            })
            return True
        return False

    async def create_table(self, table_data: Dict[str, Any]) -> Dict[str, Any]:
        table_num = table_data.get("table_number")
        doc_id = str(table_num)
        table_data["_id"] = doc_id
        if "status" not in table_data:
            table_data["status"] = "free"
        self.db.collection('tables').document(doc_id).set(table_data)
        return table_data

    async def update_table(self, table_number: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        docs = self.db.collection('tables').where('table_number', '==', table_number).stream()
        for doc in docs:
            doc.reference.update(update_data)
            updated = doc.to_dict()
            updated.update(update_data)
            return updated
        # If not found by query, try direct document lookup
        doc_ref = self.db.collection('tables').document(str(table_number))
        doc_snap = doc_ref.get()
        if doc_snap.exists:
            doc_ref.update(update_data)
            updated = doc_snap.to_dict()
            updated.update(update_data)
            return updated
        return None

    async def delete_table(self, table_number: int) -> bool:
        docs = self.db.collection('tables').where('table_number', '==', table_number).stream()
        deleted = False
        for doc in docs:
            doc.reference.delete()
            deleted = True
        if not deleted:
            doc_ref = self.db.collection('tables').document(str(table_number))
            if doc_ref.get().exists:
                doc_ref.delete()
                deleted = True
        return deleted

    async def get_gallery(self) -> List[Dict[str, Any]]:
        cached = _menu_cache.get(_KEY_GALLERY)
        if cached is None:
            logger.debug("Cache MISS: gallery -- fetching from Firestore")
            docs = self.db.collection('gallery_images').stream()
            cached = [doc.to_dict() for doc in docs]
            _menu_cache.set(_KEY_GALLERY, cached, _TTL_GALLERY)
        else:
            logger.debug("Cache HIT: gallery")
        return cached

    async def get_reviews(self) -> List[Dict[str, Any]]:
        cached = _menu_cache.get(_KEY_REVIEWS)
        if cached is None:
            logger.debug("Cache MISS: reviews -- fetching from Firestore")
            try:
                docs = self.db.collection('reviews').order_by('created_at', direction=firestore.Query.DESCENDING).stream()
                cached = [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.warning(f"Fallback to memory sort for reviews: {e}")
                docs = self.db.collection('reviews').stream()
                cached = [doc.to_dict() for doc in docs]
                cached.sort(key=lambda x: str(x.get('created_at', '')), reverse=True)
            _menu_cache.set(_KEY_REVIEWS, cached, _TTL_REVIEWS)
        else:
            logger.debug("Cache HIT: reviews")
        return cached

    async def get_settings(self) -> Dict[str, Any]:
        docs = self.db.collection('settings').stream()
        return {doc.to_dict().get("key"): doc.to_dict().get("value") for doc in docs}

    async def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = order_data.get("order_id") or str(uuid.uuid4())
        order_data["_id"] = doc_id
        if "created_at" not in order_data:
            order_data["created_at"] = datetime.utcnow().isoformat()
        
        self.db.collection('orders').document(doc_id).set(order_data)
        return order_data

    async def get_order_by_id(self, order_id: str) -> Optional[Dict[str, Any]]:
        docs = self.db.collection('orders').where('order_id', '==', order_id).stream()
        for doc in docs:
            return doc.to_dict()
        return None

    async def update_order_status(self, order_id: str, status: str, history_entry: Dict[str, Any]) -> bool:
        docs = self.db.collection('orders').where('order_id', '==', order_id).stream()
        for doc in docs:
            current_history = doc.to_dict().get('status_history', [])
            current_history.append(history_entry)
            doc.reference.update({
                'status': status,
                'status_history': current_history,
                'updated_at': datetime.utcnow().isoformat()
            })
            return True
        return False

    async def update_order(self, order_id: str, update_data: Dict[str, Any]) -> bool:
        docs = self.db.collection('orders').where('order_id', '==', order_id).stream()
        for doc in docs:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            doc.reference.update(update_data)
            return True
        return False

    async def validate_coupon(self, code: str) -> Optional[Dict[str, Any]]:
        docs = self.db.collection('coupons').where('code', '==', code.upper()).where('active', '==', True).stream()
        for doc in docs:
            return doc.to_dict()
        return None

    async def create_reservation(self, reservation_data: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = str(uuid.uuid4())
        reservation_data["_id"] = doc_id
        reservation_data["created_at"] = datetime.utcnow().isoformat()
        self.db.collection('reservations').document(doc_id).set(reservation_data)
        return reservation_data

    async def get_admin_user(self, username: str) -> Optional[Dict[str, Any]]:
        docs = self.db.collection('admin_users').where('username', '==', username).stream()
        for doc in docs:
            return doc.to_dict()
        return None

    async def get_delivery_partner_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        docs = self.db.collection('delivery_partners').where('phone', '==', phone).stream()
        for doc in docs:
            return doc.to_dict()
        return None

    async def get_orders_by_partner(self, partner_id: str) -> List[Dict[str, Any]]:
        docs = self.db.collection('orders').where('delivery_partner_id', '==', partner_id).stream()
        return [doc.to_dict() for doc in docs]

    async def get_table_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        doc = self.db.collection('table_sessions').document(session_id).get()
        return doc.to_dict() if doc.exists else None

    async def create_table_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = session_data.get("session_id") or str(uuid.uuid4())
        session_data["_id"] = doc_id
        session_data["created_at"] = datetime.utcnow().isoformat()
        self.db.collection('table_sessions').document(doc_id).set(session_data)
        return session_data

    async def update_table_session(self, session_id: str, update_data: Dict[str, Any]) -> bool:
        doc_ref = self.db.collection('table_sessions').document(session_id)
        if doc_ref.get().exists:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            doc_ref.update(update_data)
            return True
        return False

    async def get_inventory(self) -> List[Dict[str, Any]]:
        docs = self.db.collection('inventory').stream()
        return [doc.to_dict() for doc in docs]

    async def get_inventory_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        doc = self.db.collection('inventory').document(item_id).get()
        return doc.to_dict() if doc.exists else None

    async def update_inventory_item(self, item_id: str, update_data: Dict[str, Any]) -> bool:
        doc_ref = self.db.collection('inventory').document(item_id)
        if doc_ref.get().exists:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            doc_ref.update(update_data)
            return True
        return False

    async def create_inventory_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = item_data.get("_id") or str(uuid.uuid4())
        item_data["_id"] = doc_id
        item_data["created_at"] = datetime.utcnow().isoformat()
        self.db.collection('inventory').document(doc_id).set(item_data)
        return item_data

    async def get_all_orders(self, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.collection('orders')
        if status_filter and status_filter != "all":
            query = query.where('status', '==', status_filter)
        try:
            docs = query.order_by('created_at', direction=firestore.Query.DESCENDING).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.warning(f"Fallback to memory sort for orders: {e}")
            docs = query.stream()
            items = [doc.to_dict() for doc in docs]
            items.sort(key=lambda x: str(x.get('created_at', '')), reverse=True)
            return items

    async def get_orders(self) -> List[Dict[str, Any]]:
        return await self._read("orders")


    async def create_menu_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = item_data.get("_id") or str(uuid.uuid4())
        item_data["_id"] = doc_id
        item_data["created_at"] = datetime.utcnow().isoformat()
        self.db.collection('menu_items').document(doc_id).set(item_data)
        _invalidate_menu_cache()   # flush stale cache
        return item_data

    async def update_menu_item_full(self, item_id: str, update_data: Dict[str, Any]) -> bool:
        doc_ref = self.db.collection('menu_items').document(item_id)
        if doc_ref.get().exists:
            update_data['updated_at'] = datetime.utcnow().isoformat()
            doc_ref.update(update_data)
            _invalidate_menu_cache()   # flush stale cache
            return True
        return False

    async def delete_menu_item(self, item_id: str) -> bool:
        doc_ref = self.db.collection('menu_items').document(item_id)
        if doc_ref.get().exists:
            doc_ref.delete()
            _invalidate_menu_cache()   # flush stale cache
            return True
        return False

    async def create_gallery_image(self, image_data: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = image_data.get("_id") or str(uuid.uuid4())
        image_data["_id"] = doc_id
        image_data["created_at"] = datetime.utcnow().isoformat()
        self.db.collection('gallery_images').document(doc_id).set(image_data)
        _menu_cache.invalidate(_KEY_GALLERY)   # flush gallery cache
        return image_data

    async def delete_gallery_image(self, image_id: str) -> bool:
        doc_ref = self.db.collection('gallery_images').document(image_id)
        if doc_ref.get().exists:
            doc_ref.delete()
            _menu_cache.invalidate(_KEY_GALLERY)   # flush gallery cache
            return True
        return False

    async def get_setting(self, key: str) -> Optional[str]:
        docs = self.db.collection('settings').where('key', '==', key).stream()
        for doc in docs:
            return doc.to_dict().get("value")
        return None

    async def update_setting(self, key: str, value: str) -> bool:
        docs = self.db.collection('settings').where('key', '==', key).stream()
        found = False
        for doc in docs:
            doc.reference.update({
                'value': value,
                'updated_at': datetime.utcnow().isoformat()
            })
            found = True
            break
            
        if not found:
            self.db.collection('settings').add({
                'key': key,
                'value': value,
                'updated_at': datetime.utcnow().isoformat()
            })
        return True
