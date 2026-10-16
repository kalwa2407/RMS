import os
import time
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Output directories
DEST_DIRS = [
    r"C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar\AppStore_Showcase_Graphics",
    r"C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar\PlayStore_Showcase_Graphics",
    os.path.join("playstore_assets", "AppStore_Showcase_Graphics"),
    os.path.join("playstore_assets", "PlayStore_Showcase_Graphics"),
]

for d in DEST_DIRS:
    os.makedirs(d, exist_ok=True)

RAW_SCREENS_DIR = os.path.join("playstore_assets", "raw_screens")
os.makedirs(RAW_SCREENS_DIR, exist_ok=True)

print("1. Capturing high-resolution mobile screens via headless Chrome...")

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=430,932")
opts.add_argument("--force-device-scale-factor=2.5")
opts.add_argument("--hide-scrollbars")
opts.add_argument("--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148")

screens_config = [
    {
        "id": "01_home",
        "tab": "home",
        "badge": "ESTD. 1978 · ROYAL HERITAGE",
        "title1": "ROYAL DINING",
        "title2": "AT YOUR FINGERTIPS",
        "subtitle": "Authentic Biryanis, Raan & Kebabs delivered in clay handis.",
        "pills": [
            ("Top Rated Cuisine", "Kashmir Saffron Dum"),
            ("30-Min Fast Delivery", "Hot to your doorstep")
        ]
    },
    {
        "id": "02_order",
        "tab": "order",
        "badge": "100+ SIGNATURE DISHES",
        "title1": "EXPLORE & ORDER",
        "title2": "FRESH TO YOUR DOOR",
        "subtitle": "Browse curated categories, customized spices & live kitchen tracking.",
        "pills": [
            ("Sealed Clay Handi", "Aroma locked for 4+ hrs"),
            ("100% Halal Certified", "Royal Mughlai recipes")
        ]
    },
    {
        "id": "03_dining",
        "tab": "dining",
        "badge": "VIP TABLE RESERVATIONS",
        "title1": "RESERVE ROYAL TABLES",
        "title2": "WITH DASTARKHWAN",
        "subtitle": "Book Royal Dastarkhwan, Family Feasts & Candlelight dining moods.",
        "pills": [
            ("Zero Waiting Time", "Instant confirmation"),
            ("4 Mood Ambiances", "Authentic diwan seating")
        ]
    },
    {
        "id": "04_rewards",
        "tab": "rewards",
        "badge": "PD COINS LOYALTY PRIVILEGE",
        "title1": "EARN REWARD COINS",
        "title2": "ON EVERY FEAST",
        "subtitle": "10% cashback on delivery & dine-in. Redeem coins for free treats.",
        "pills": [
            ("1 Coin = 1 Rupee", "Direct bill discount"),
            ("VIP Gold Tier", "Exclusive chef tastings")
        ]
    },
    {
        "id": "05_profile",
        "tab": "profile",
        "badge": "PATRON PASSPORT & ORDERS",
        "title1": "ZOMATO-STYLE PROFILE",
        "title2": "ALL-IN-ONE APP SHELL",
        "subtitle": "Track past orders, active table bookings, addresses & 1-click reorder.",
        "pills": [
            ("1-Click Reorder", "Favorite dishes in seconds"),
            ("Direct Outlet Concierge", "Kurla, Andheri, Bandra, Camp")
        ]
    }
]

captured_files = {}

need_capture = any(not os.path.exists(os.path.join(RAW_SCREENS_DIR, f"{sc['id']}_raw.png")) for sc in screens_config)

if need_capture:
    driver = webdriver.Chrome(options=opts)
    try:
        for sc in screens_config:
            raw_path = os.path.join(RAW_SCREENS_DIR, f"{sc['id']}_raw.png")
            if os.path.exists(raw_path):
                captured_files[sc['id']] = raw_path
                continue

            url = f"http://localhost:3000/customer/dashboard?tab={sc['tab']}"
            print(f"  Fetching tab [{sc['tab']}] from {url}...")
            driver.get(url)
            time.sleep(2)

            driver.execute_script("""
                localStorage.setItem('pwa_prompt_dismissed_at', String(Date.now() + 86400000));
                localStorage.setItem('customer_phone', '+91 98765 43210');
                localStorage.setItem('customer_name', 'Aman Talukdar');
                localStorage.setItem('customer_address', 'Camp Area, Pune, Maharashtra');
                localStorage.setItem('pd_coins_balance', '420');
                localStorage.setItem('pd_streak_days', '5');
            """)
            time.sleep(1)

            driver.execute_script("""
                const btns = Array.from(document.querySelectorAll('button'));
                const dismissBtn = btns.find(b => b.textContent.includes('Continue') || b.textContent.includes('Dismiss'));
                if (dismissBtn) dismissBtn.click();
                const closeBtn = document.querySelector('button .lucide-x');
                if (closeBtn) closeBtn.closest('button').click();
            """)
            time.sleep(1.5)

            driver.save_screenshot(raw_path)
            captured_files[sc['id']] = raw_path
            print(f"    -> Saved raw screen for {sc['id']}")
    finally:
        driver.quit()
else:
    for sc in screens_config:
        captured_files[sc['id']] = os.path.join(RAW_SCREENS_DIR, f"{sc['id']}_raw.png")
    print("  Using existing crisp raw screens.")

print("\n2. Designing World-Class App Store Showcase Graphics (1242 x 2688)...")

# Font setup
def get_font(name, size):
    font_path = os.path.join(r"C:\Windows\Fonts", name)
    if os.path.exists(font_path):
        return ImageFont.truetype(font_path, size)
    return ImageFont.load_default()

font_badge = get_font("segoeuib.ttf", 26)
font_title = get_font("segoeuib.ttf", 64)
font_sub = get_font("segoeui.ttf", 32)
font_pill_title = get_font("segoeuib.ttf", 26)
font_pill_sub = get_font("segoeui.ttf", 21)

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)

def render_showcase(sc, raw_img_path, target_w=1242, target_h=2688):
    # 1. Base Canvas & Royal Gradient
    canvas = Image.new("RGBA", (target_w, target_h), (8, 16, 23, 255))
    draw = ImageDraw.Draw(canvas)

    # Vertical rich gradient
    for y in range(target_h):
        ratio = y / target_h
        # Deep Obsidian Navy (#081017) to Royal Midnight Sapphire (#0f2430)
        r = int(8 + (15 - 8) * ratio)
        g = int(16 + (36 - 16) * ratio)
        b = int(23 + (48 - 23) * ratio)
        draw.line([(0, y), (target_w, y)], fill=(r, g, b, 255))

    # Ambient Gold Radial Glow behind the phone
    glow_center_x = target_w // 2
    glow_center_y = int(target_h * 0.58)
    glow_radius = 560
    glow_img = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    
    # Draw soft golden halo circles
    for r in range(glow_radius, 0, -20):
        alpha = int(45 * (1.0 - (r / glow_radius)) ** 1.8)
        glow_draw.ellipse(
            [(glow_center_x - r, glow_center_y - r), (glow_center_x + r, glow_center_y + r)],
            fill=(245, 158, 11, alpha)
        )
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(35))
    canvas = Image.alpha_composite(canvas, glow_img)
    draw = ImageDraw.Draw(canvas)

    # Royal Golden Border Filigree at top
    draw.line([(80, 50), (target_w - 80, 50)], fill=(212, 175, 55, 90), width=2)
    draw.ellipse([(target_w // 2 - 6, 44), (target_w // 2 + 6, 56)], fill=(212, 175, 55, 200))

    # 2. Header Text Section
    curr_y = 100

    # Badge pill
    badge_text = sc["badge"]
    badge_bbox = font_badge.getbbox(badge_text)
    badge_w = badge_bbox[2] - badge_bbox[0] + 50
    badge_h = badge_bbox[3] - badge_bbox[1] + 24
    badge_x = (target_w - badge_w) // 2

    # Draw Badge Glass Box
    draw_rounded_rect(draw, [(badge_x, curr_y), (badge_x + badge_w, curr_y + badge_h)], radius=16,
                      fill=(245, 158, 11, 35), outline=(245, 158, 11, 140), width=2)
    draw.text((badge_x + 25, curr_y + 10), badge_text, font=font_badge, fill=(251, 191, 36, 255))

    curr_y += badge_h + 30

    # Title Line 1 (White)
    t1_bbox = font_title.getbbox(sc["title1"])
    t1_w = t1_bbox[2] - t1_bbox[0]
    draw.text(((target_w - t1_w) // 2, curr_y), sc["title1"], font=font_title, fill=(255, 255, 255, 255))
    curr_y += 76

    # Title Line 2 (Vibrant Persian Gold)
    t2_bbox = font_title.getbbox(sc["title2"])
    t2_w = t2_bbox[2] - t2_bbox[0]
    draw.text(((target_w - t2_w) // 2, curr_y), sc["title2"], font=font_title, fill=(245, 158, 11, 255))
    curr_y += 84

    # Subtitle
    sub_bbox = font_sub.getbbox(sc["subtitle"])
    sub_w = sub_bbox[2] - sub_bbox[0]
    draw.text(((target_w - sub_w) // 2, curr_y), sc["subtitle"], font=font_sub, fill=(203, 213, 225, 230))
    curr_y += 75

    # 3. Smartphone Device Mockup
    phone_w = 930
    phone_h = 1920
    phone_x = (target_w - phone_w) // 2
    phone_y = curr_y + 35

    # Drop shadow for 3D elevation
    shadow_img = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_img)
    shadow_offset_y = 35
    shadow_draw.rounded_rectangle(
        [(phone_x - 15, phone_y + shadow_offset_y - 15), (phone_x + phone_w + 15, phone_y + phone_h + shadow_offset_y + 15)],
        radius=75,
        fill=(0, 0, 0, 180)
    )
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(32))
    canvas = Image.alpha_composite(canvas, shadow_img)
    draw = ImageDraw.Draw(canvas)

    # Phone Outer Bezel (Sleek Space Gray / Titanium frame)
    draw_rounded_rect(draw, [(phone_x, phone_y), (phone_x + phone_w, phone_y + phone_h)],
                      radius=70, fill=(26, 32, 44, 255), outline=(74, 85, 104, 255), width=4)

    # Phone Inner Screen Area
    bezel_padding = 18
    screen_x = phone_x + bezel_padding
    screen_y = phone_y + bezel_padding
    screen_w = phone_w - (bezel_padding * 2)
    screen_h = phone_h - (bezel_padding * 2)

    # Load captured screen, crop & resize
    if os.path.exists(raw_img_path):
        raw_screen = Image.open(raw_img_path).convert("RGBA")
        raw_w, raw_h = raw_screen.size
        # Crop top status bar if needed, scale nicely
        screen_aspect = screen_w / float(screen_h)
        target_crop_h = int(raw_w / screen_aspect)
        if target_crop_h > raw_h:
            target_crop_h = raw_h
        raw_cropped = raw_screen.crop((0, 0, raw_w, target_crop_h))
        screen_resized = raw_cropped.resize((screen_w, screen_h), Image.Resampling.LANCZOS)

        # Create rounded mask for screen
        mask = Image.new("L", (screen_w, screen_h), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([(0, 0), (screen_w, screen_h)], radius=56, fill=255)

        canvas.paste(screen_resized, (screen_x, screen_y), mask)

    # Draw Dynamic Island Pill on top of screen
    island_w = 175
    island_h = 38
    island_x = screen_x + (screen_w - island_w) // 2
    island_y = screen_y + 16
    draw_rounded_rect(draw, [(island_x, island_y), (island_x + island_w, island_y + island_h)],
                      radius=19, fill=(0, 0, 0, 255))
    # Camera lens reflection
    draw.ellipse([(island_x + island_w - 28, island_y + 11), (island_x + island_w - 12, island_y + 27)],
                 fill=(20, 25, 45, 255), outline=(50, 60, 90, 255))

    # 4. Floating Graphic Callout Cards ("Kalakari" badges)
    pill_cards = sc["pills"]
    
    # Badge 1 (Left floating card)
    p1_title, p1_sub = pill_cards[0]
    p1_w = 400
    p1_h = 100
    p1_x = 45
    p1_y = phone_y + 260
    
    # Card shadow
    card_shadow = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    cs_draw = ImageDraw.Draw(card_shadow)
    cs_draw.rounded_rectangle([(p1_x - 5, p1_y + 10), (p1_x + p1_w + 5, p1_y + p1_h + 20)], radius=22, fill=(0, 0, 0, 160))
    card_shadow = card_shadow.filter(ImageFilter.GaussianBlur(16))
    canvas = Image.alpha_composite(canvas, card_shadow)
    draw = ImageDraw.Draw(canvas)

    # Glass card container
    draw_rounded_rect(draw, [(p1_x, p1_y), (p1_x + p1_w, p1_y + p1_h)], radius=20,
                      fill=(15, 23, 42, 230), outline=(245, 158, 11, 200), width=2)
    # Inner gold bar
    draw.rounded_rectangle([(p1_x + 14, p1_y + 18), (p1_x + 20, p1_y + p1_h - 18)], radius=3, fill=(245, 158, 11, 255))
    draw.text((p1_x + 36, p1_y + 20), p1_title, font=font_pill_title, fill=(255, 255, 255, 255))
    draw.text((p1_x + 36, p1_y + 56), p1_sub, font=font_pill_sub, fill=(203, 213, 225, 255))

    # Badge 2 (Right floating card)
    p2_title, p2_sub = pill_cards[1]
    p2_w = 420
    p2_h = 100
    p2_x = target_w - p2_w - 45
    p2_y = phone_y + 540

    # Card shadow
    card_shadow2 = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    cs_draw2 = ImageDraw.Draw(card_shadow2)
    cs_draw2.rounded_rectangle([(p2_x - 5, p2_y + 10), (p2_x + p2_w + 5, p2_y + p2_h + 20)], radius=22, fill=(0, 0, 0, 160))
    card_shadow2 = card_shadow2.filter(ImageFilter.GaussianBlur(16))
    canvas = Image.alpha_composite(canvas, card_shadow2)
    draw = ImageDraw.Draw(canvas)

    # Glass card container
    draw_rounded_rect(draw, [(p2_x, p2_y), (p2_x + p2_w, p2_y + p2_h)], radius=20,
                      fill=(15, 23, 42, 230), outline=(245, 158, 11, 200), width=2)
    # Inner gold bar
    draw.rounded_rectangle([(p2_x + 14, p2_y + 18), (p2_x + 20, p2_y + p2_h - 18)], radius=3, fill=(245, 158, 11, 255))
    draw.text((p2_x + 36, p2_y + 20), p2_title, font=font_pill_title, fill=(255, 255, 255, 255))
    draw.text((p2_x + 36, p2_y + 56), p2_sub, font=font_pill_sub, fill=(203, 213, 225, 255))

    return canvas.convert("RGB")

for sc in screens_config:
    raw_path = captured_files.get(sc["id"])
    if not raw_path or not os.path.exists(raw_path):
        continue
    
    print(f"  Rendering artwork for {sc['id']}...")
    # App Store standard 1242 x 2688
    art_1242 = render_showcase(sc, raw_path, 1242, 2688)

    # Also render Google Play 1080 x 2400 (scaled Lanczos)
    art_1080 = art_1242.resize((1080, 2400), Image.Resampling.LANCZOS)

    # Save to all target folders
    filename_ios = f"{sc['id']}_AppStore_1242x2688.png"
    filename_play = f"{sc['id']}_PlayStore_1080x2400.png"

    # Save iOS 1242x2688
    p_ios_desk = os.path.join(r"C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar\AppStore_Showcase_Graphics", filename_ios)
    p_ios_local = os.path.join("playstore_assets", "AppStore_Showcase_Graphics", filename_ios)
    art_1242.save(p_ios_desk, "PNG", optimize=True)
    art_1242.save(p_ios_local, "PNG", optimize=True)

    # Save Play Store 1080x2400
    p_play_desk = os.path.join(r"C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar\PlayStore_Showcase_Graphics", filename_play)
    p_play_local = os.path.join("playstore_assets", "PlayStore_Showcase_Graphics", filename_play)
    art_1080.save(p_play_desk, "PNG", optimize=True)
    art_1080.save(p_play_local, "PNG", optimize=True)

    print(f"    [OK] Generated {filename_ios} & {filename_play}")

print("\nALL APP STORE & PLAY STORE SHOWCASE GRAPHICS SUCCESSFULLY CREATED!")
