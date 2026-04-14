import os
import sys
import getpass
import uuid
import datetime

# Ensure we're running from the root folder where backend/ is located
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set env vars to use Firebase production mode
os.environ["DB_MODE"] = "FIREBASE"
os.environ["FIREBASE_CREDENTIALS"] = os.path.join("backend", "firebase_credentials.json")

from backend.auth import get_password_hash
from backend.firebase_manager import FirebaseManager

def main():
    print("=" * 50)
    print(" CREATE SECURE ADMIN USER IN PRODUCTION DATABASE")
    print("=" * 50)
    
    username = input("Enter new Admin Username (e.g. Aman@Tasteofhindustan): ").strip()
    if not username:
        print("Username cannot be empty.")
        return
        
    password = getpass.getpass("Enter secure password (hidden): ")
    if not password:
        print("Password cannot be empty.")
        return
        
    confirm_password = getpass.getpass("Confirm password (hidden): ")
    if password != confirm_password:
        print("Passwords do not match!")
        return
        
    print("\nConnecting to Production Firebase Database...")
    try:
        manager = FirebaseManager()
        
        admin_data = {
            "_id": str(uuid.uuid4()),
            "username": username,
            "password": get_password_hash(password),
            "created_at": datetime.datetime.utcnow().isoformat()
        }
        
        # Save to real production database
        manager.db.collection("admin_users").document(admin_data["_id"]).set(admin_data)
        
        print(f"\n✅ SUCCESS! Admin user '{username}' has been created securely.")
        print("The password was individually hashed and uploaded.")
        print("You can now login to the admin panel using these credentials.")
        
    except Exception as e:
        print(f"\n❌ Error connecting to database: {e}")

if __name__ == "__main__":
    main()
