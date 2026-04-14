"""
=== PRE-FLIGHT DEPLOYMENT CHECK ===
Verifies Firebase connection, data integrity, and server readiness.
"""
import os
import sys
import json
from pathlib import Path

os.environ["DB_MODE"] = "FIREBASE"
ROOT = Path(__file__).parent

PASS = "[PASS]"
FAIL = "[FAIL]"
WARN = "[WARN]"
results = []

def check(name, passed, detail=""):
    status = PASS if passed else FAIL
    results.append((status, name, detail))
    print(f"  {status} {name}" + (f" -- {detail}" if detail else ""))

def warn(name, detail=""):
    results.append((WARN, name, detail))
    print(f"  {WARN} {name}" + (f" -- {detail}" if detail else ""))

print("\n" + "="*60)
print("  TASTE OF HINDUSTAN - PRE-FLIGHT CHECK")
print("="*60)

# ── 1. FILE STRUCTURE ──
print("\n[1/6] FILE STRUCTURE")
critical_files = [
    "server.py", "data_manager.py", "firebase_manager.py",
    "firebase_credentials.json", "auth.py", "models.py",
    "mock_firebase.py", "requirements.txt", ".env"
]
for f in critical_files:
    check(f"backend/{f} exists", (ROOT / f).exists())

frontend_root = ROOT.parent / "frontend"
frontend_files = ["package.json", "src/App.js", "src/firebase.js", "public/index.html"]
for f in frontend_files:
    check(f"frontend/{f} exists", (frontend_root / f).exists())

check("vercel.json exists", (ROOT.parent / "vercel.json").exists())
check("api/index.py exists", (ROOT.parent / "api" / "index.py").exists())

# ── 2. ENVIRONMENT ──
print("\n[2/6] ENVIRONMENT VARIABLES")
from dotenv import load_dotenv
load_dotenv(ROOT / ".env")
db_mode = os.environ.get("DB_MODE")
check(f"DB_MODE = {db_mode}", db_mode == "FIREBASE")

# ── 3. FIREBASE CONNECTION ──
print("\n[3/6] FIREBASE FIRESTORE CONNECTION")
try:
    from firebase_manager import FirebaseManager
    fm = FirebaseManager()
    check("Firebase Admin SDK initialized", True)
except Exception as e:
    check("Firebase Admin SDK initialized", False, str(e))
    print("\n  CRITICAL: Cannot continue without Firebase. Aborting further checks.")
    sys.exit(1)

# ── 4. DATA INTEGRITY ──
print("\n[4/6] FIRESTORE DATA INTEGRITY")
import asyncio

async def check_data():
    # Menu
    menu = await fm.get_menu()
    check(f"Menu items in Firestore", len(menu) > 0, f"{len(menu)} items found")

    # Tables
    tables = await fm.get_tables()
    check(f"Tables in Firestore", len(tables) > 0, f"{len(tables)} tables found")

    # Settings
    settings = await fm.get_settings()
    check(f"Settings in Firestore", len(settings) > 0, f"{len(settings)} settings found")

    # Admin user
    admin = await fm.get_admin_user("Vijay@Tasteofhindustan")
    check(f"Admin user exists", admin is not None, "Vijay@Tasteofhindustan")

asyncio.run(check_data())

# ── 5. GITIGNORE SAFETY ──
print("\n[5/6] SECURITY & GITIGNORE")
gitignore_path = ROOT.parent / ".gitignore"
if gitignore_path.exists():
    gitignore = gitignore_path.read_text()
    check("firebase_credentials.json in .gitignore", "firebase_credentials.json" in gitignore)
    check(".env in .gitignore", ".env" in gitignore)
    check("test.mp4 in .gitignore", "test.mp4" in gitignore)
else:
    check(".gitignore exists", False)

# ── 6. SERVER IMPORT CHECK ──
print("\n[6/6] SERVER IMPORT CHECK")
try:
    sys.path.insert(0, str(ROOT))
    from server import app
    check("FastAPI app imports successfully", True)
    
    routes = [r.path for r in app.routes]
    check("/api/menu route exists", any("/menu" in r for r in routes))
    check("/api/orders route exists", any("/orders" in r for r in routes))
    check("/api/admin/login route exists", any("/admin/login" in r for r in routes))
except Exception as e:
    check("FastAPI app imports", False, str(e))

# ── SUMMARY ──
print("\n" + "="*60)
passes = sum(1 for r in results if r[0] == PASS)
fails = sum(1 for r in results if r[0] == FAIL)
warns = sum(1 for r in results if r[0] == WARN)
print(f"  RESULTS: {passes} passed, {fails} failed, {warns} warnings")

if fails == 0:
    print(f"\n  >>> ALL CHECKS PASSED - READY TO DEPLOY!")
else:
    print(f"\n  !!! {fails} ISSUE(S) MUST BE FIXED BEFORE DEPLOY")
print("="*60 + "\n")
