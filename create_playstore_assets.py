import os
import time
from PIL import Image, ImageDraw, ImageFont
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

OUT_DIR = r"C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar"
os.makedirs(OUT_DIR, exist_ok=True)

# ── 1. Create App Icon (512x512 PNG) ──────────────────────────────────────────
print("Generating 512x512 App Icons...")

# Option A: Exact Webapp Nav Logo (Gold on Dark Brand Canvas)
logo_nav_path = os.path.join("frontend", "public", "logo-nav-gold.png")
if os.path.exists(logo_nav_path):
    logo = Image.open(logo_nav_path).convert("RGBA")
    # Base 512x512 background: Persian Darbar royal brand color (#184956)
    icon_bg = Image.new("RGBA", (512, 512), (24, 73, 86, 255))
    
    # Scale logo preserving aspect ratio to fit nicely inside 512x512 (with ~48px padding)
    target_w = 420
    w_percent = target_w / float(logo.size[0])
    target_h = int(float(logo.size[1]) * float(w_percent))
    logo_resized = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    offset_x = (512 - target_w) // 2
    offset_y = (512 - target_h) // 2
    icon_bg.paste(logo_resized, (offset_x, offset_y), logo_resized)
    icon_bg.convert("RGB").save(os.path.join(OUT_DIR, "app_icon_512x512.png"), "PNG", optimize=True)
    print("  -> Saved app_icon_512x512.png")

# Option B: Royal Crown Emblem (512x512)
crown_logo_path = os.path.join("frontend", "public", "persian_darbar_logo_1776079280186.png")
if os.path.exists(crown_logo_path):
    crown = Image.open(crown_logo_path).convert("RGB")
    crown_512 = crown.resize((512, 512), Image.Resampling.LANCZOS)
    crown_512.save(os.path.join(OUT_DIR, "app_icon_crown_512x512.png"), "PNG", optimize=True)
    print("  -> Saved app_icon_crown_512x512.png")

# ── 2. Create Feature Graphic (1024x500 PNG) ──────────────────────────────────
print("Generating 1024x500 Feature Graphic...")
feat_bg = Image.new("RGB", (1024, 500), (15, 41, 51))
draw = ImageDraw.Draw(feat_bg)
# Gradient background
for y in range(500):
    r = int(15 + (24 - 15) * (y / 500))
    g = int(41 + (73 - 41) * (y / 500))
    b = int(51 + (86 - 51) * (y / 500))
    draw.line([(0, y), (1024, y)], fill=(r, g, b))

if os.path.exists(logo_nav_path):
    logo = Image.open(logo_nav_path).convert("RGBA")
    target_w = 600
    w_percent = target_w / float(logo.size[0])
    target_h = int(float(logo.size[1]) * float(w_percent))
    logo_resized = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    offset_x = (1024 - target_w) // 2
    offset_y = (500 - target_h) // 2 - 25
    feat_bg.paste(logo_resized, (offset_x, offset_y), logo_resized)

feat_bg.save(os.path.join(OUT_DIR, "feature_graphic_1024x500.png"), "PNG", optimize=True)
print("  -> Saved feature_graphic_1024x500.png")

# ── 3. Capture Android Mobile Screenshots ─────────────────────────────────────
print("Launching Chrome in Mobile Emulation for Android Screenshots...")
opts = Options()
opts.add_argument("--headless=new")
# Pixel 7 / Galaxy resolution (1080 x 2400 standard aspect ratio)
opts.add_argument("--window-size=432,960")
opts.add_argument("--force-device-scale-factor=2.5")
opts.add_argument("--hide-scrollbars")
opts.add_argument("--user-agent=Mozilla/5.0 (Linux; Android 14; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36")

driver = webdriver.Chrome(options=opts)

screens = [
    ("01_home_screen.png", "https://www.persiandarbar.in/"),
    ("02_menu_screen.png", "https://www.persiandarbar.in/menu"),
    ("03_order_online_screen.png", "https://www.persiandarbar.in/order"),
    ("04_table_reservation_screen.png", "https://www.persiandarbar.in/reservation"),
    ("05_reviews_screen.png", "https://www.persiandarbar.in/reviews"),
]

try:
    for filename, url in screens:
        print(f"  Capturing {filename} from {url}...")
        driver.get(url)
        time.sleep(3.5) # Wait for images, fonts, animations to settle
        
        # Hide any debug overlays or cookie banners if present
        driver.execute_script("""
            window.scrollTo(0, 80);
        """)
        time.sleep(1)
        
        raw_path = os.path.join(OUT_DIR, f"temp_{filename}")
        driver.save_screenshot(raw_path)
        
        # Load and resize to exact standard 1080 x 2400 (or keep ultra crisp)
        img = Image.open(raw_path).convert("RGB")
        target_size = (1080, 2400)
        img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
        final_path = os.path.join(OUT_DIR, filename)
        img_resized.save(final_path, "PNG", optimize=True)
        if os.path.exists(raw_path):
            os.remove(raw_path)
        print(f"  -> Saved {filename} ({target_size[0]}x{target_size[1]})")

finally:
    driver.quit()

print("\nALL PLAY STORE ASSETS GENERATED SUCCESSFULLY IN:")
print(OUT_DIR)
