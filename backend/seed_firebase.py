import os
import json
import asyncio
from pathlib import Path

# Set environment
os.environ["DB_MODE"] = "FIREBASE"
os.environ["FIREBASE_CREDENTIALS"] = "firebase_credentials.json"

from firebase_manager import FirebaseManager

async def seed():
    print("Initializing Firebase Manager...")
    manager = FirebaseManager()
    
    mock_dir = Path(__file__).parent / "db_mock"
    
    collections = [
        "admin_users", "menu_items", "tables", "settings"
    ]
    
    print("Starting data transfer to real Firestore...")
    
    for coll in collections:
        file_path = mock_dir / f"{coll}.json"
        if file_path.exists():
            with open(file_path, "r") as f:
                data = json.load(f)
                if data:
                    print(f"Uploading {len(data)} items to {coll}...")
                    for item in data:
                        doc_id = item.get("_id") or item.get("id")
                        if doc_id:
                            manager.db.collection(coll).document(doc_id).set(item)
                    print(f"Finished {coll}.")
    
    print("Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
