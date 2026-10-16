import os
import sys
import time
import threading
import json
import http.server
import socketserver
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from playwright.sync_api import sync_playwright

# Directories
WORKSPACE = os.path.dirname(os.path.abspath(__file__))
BUILD_DIR = os.path.join(WORKSPACE, "frontend", "build")
PUBLIC_DIR = os.path.join(WORKSPACE, "frontend", "public")
RAW_SCREENS_DIR = os.path.join(WORKSPACE, "playstore_assets", "raw_screens")

IOS_DEST_DIRS = [
    os.path.join(WORKSPACE, "playstore_assets", "AppStore_Showcase_Graphics"),
    r"C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar\AppStore_Showcase_Graphics",
]

ANDROID_DEST_DIRS = [
    os.path.join(WORKSPACE, "playstore_assets", "PlayStore_Showcase_Graphics"),
    r"C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar\PlayStore_Showcase_Graphics",
]

DESKTOP_DIR = r"C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar"

for d in IOS_DEST_DIRS + ANDROID_DEST_DIRS + [RAW_SCREENS_DIR, DESKTOP_DIR]:
    os.makedirs(d, exist_ok=True)

PORT = 3456

class SPARequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BUILD_DIR, **kwargs)

    def do_GET(self):
        # Serve index.html for React SPA client-side routes
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = '/index.html'
        return super().do_GET()

class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

def start_server():
    server = ThreadingServer(("", PORT), SPARequestHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    return server

# Configuration for 5 showcases (Refined, prestigious, no broken glyphs)
SCREENS_CONFIG = [
    {
        "id": "01_home",
        "tab": "home",
        "badge": "ESTD. 1978 • ROYAL MUGHLAI HERITAGE",
        "title1": "ROYAL MUGHLAI FEASTS",
        "title2": "DELIVERED TO YOUR DOOR",
        "subtitle": "Authentic Dum Biryanis, Raan & Kebabs cooked slow in clay handis.",
    },
    {
        "id": "02_order",
        "tab": "order",
        "badge": "100+ SHAHI SIGNATURE RECIPES",
        "title1": "EXPLORE & CUSTOMISE",
        "title2": "WITH 1-TAP CONVENIENCE",
        "subtitle": "Curated Mughlai cuts, bespoke spices, ratings & live preparation tracking.",
    },
    {
        "id": "03_reserve",
        "tab": "reserve",
        "badge": "FINE DINING & DASTARKHWAN",
        "title1": "INSTANT ROYAL TABLES",
        "title2": "GUARANTEED ZERO WAITING",
        "subtitle": "Book private Dastarkhwan, Family Feasts & Candlelight dining moods.",
    },
    {
        "id": "04_vip_pass",
        "tab": "vip_pass",
        "badge": "ROYAL VIP TABLE PASS",
        "title1": "YOUR VIP DINING PASS",
        "title2": "CONFIRMED IN SECONDS",
        "subtitle": "Digital table ticket with instant seating confirmation and WhatsApp concierge.",
    },
    {
        "id": "05_rewards",
        "tab": "rewards",
        "badge": "ROYALTY PRIVILEGE CLUB",
        "title1": "EARN PD COINS",
        "title2": "ON EVERY ROYAL ORDER",
        "subtitle": "10% cashback on delivery & dine-in. Redeem coins for instant bill discounts.",
    }
]

def capture_fresh_screens():
    print(f"1. Starting local SPA server on http://localhost:{PORT}...")
    server = start_server()
    time.sleep(1)

    print("2. Launching Playwright with iPhone 15 Pro Max device emulation...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        context = browser.new_context(
            viewport={"width": 430, "height": 932},
            device_scale_factor=2.8,
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        )

        # ── Pre-inject Auth State BEFORE Any Navigation Starts ──
        # This completely guarantees that CustomerDashboard mounts in a fully authenticated VIP patron state.
        init_js = """
            localStorage.setItem('customer_jwt', 'persian_darbar_mock_vip_jwt_2026');
            localStorage.setItem('customer_uid', 'cust_pd_aman_9594287868');
            localStorage.setItem('customer_name', 'Aman Talukdar');
            localStorage.setItem('customer_phone', '9594287868');
            localStorage.setItem('customer_email', 'aman@persiandarbar.in');
            localStorage.setItem('customer_address', 'Renaissance Business Centre, Camp Area, Pune');
            localStorage.setItem('customer_login_provider', 'phone');
            localStorage.setItem('customer_profile', JSON.stringify({
                uid: 'cust_pd_aman_9594287868',
                name: 'Aman Talukdar',
                phone: '9594287868',
                email: 'aman@persiandarbar.in',
                address: 'Renaissance Business Centre, Camp Area, Pune',
                coins: 450,
                loyalty_points: 450,
                tier: 'Gold Patron'
            }));
            localStorage.setItem('pd_coins_balance', '450');
            localStorage.setItem('pwa_prompt_dismissed_at', String(Date.now() + 86400000000));
            sessionStorage.setItem('customer_guest_browse', 'true');
            localStorage.setItem('customer_guest_browse', 'true');
        """
        context.add_init_script(init_js)

        # Catch-all and specific mock API routes to prevent network hangs
        def handle_reservations_api(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({
                    "success": True,
                    "id": "PD-RES-8921",
                    "_id": "PD-RES-8921",
                    "status": "confirmed",
                    "date": "18 Oct 2026",
                    "time": "08:30 PM",
                    "guests": 4,
                    "dining_mood": "Royal Dastarkhwan"
                })
            )
        context.route("**/api/reservations**", handle_reservations_api)

        def handle_profile_api(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({
                    "uid": "cust_pd_aman_9594287868",
                    "name": "Aman Talukdar",
                    "phone": "9594287868",
                    "email": "aman@persiandarbar.in",
                    "address": "Renaissance Business Centre, Camp Area, Pune",
                    "coins": 450,
                    "loyalty_points": 450,
                    "tier": "Gold Patron"
                })
            )
        context.route("**/api/customer/profile**", handle_profile_api)

        def handle_catchall_api(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({"success": True})
            )
        context.route("**/api/**", handle_catchall_api)

        page = context.new_page()

        for sc in SCREENS_CONFIG:
            raw_path = os.path.join(RAW_SCREENS_DIR, f"{sc['id']}_raw.png")
            print(f"  Capturing [{sc['id']}]...")

            tab_name = "reserve" if sc["tab"] in ["reserve", "vip_pass"] else sc["tab"]
            url = f"http://localhost:{PORT}/customer/dashboard?tab={tab_name}"
            page.goto(url, wait_until="domcontentloaded", timeout=20000)
            time.sleep(2.0)

            # Dismiss any prompt / banner
            page.evaluate("""
                () => {
                    const dismissButtons = Array.from(document.querySelectorAll('button')).filter(b => 
                        b.textContent.includes('Dismiss') || b.textContent.includes('Close') || b.textContent.includes('Later')
                    );
                    dismissButtons.forEach(btn => btn.click());
                }
            """)

            if sc["id"] == "04_vip_pass":
                # Trigger booking success VIP Dining Pass state
                print("    Triggering VIP Dining Pass confirmation...")
                page.evaluate("""
                    () => {
                        const form = document.querySelector('form');
                        if (form) {
                            const submitBtn = form.querySelector('button[type="submit"]');
                            if (submitBtn) submitBtn.click();
                        }
                    }
                """)
                time.sleep(2.0)

                # Dismiss toast and scroll window so the VIP Dining Pass ticket is front and center
                page.evaluate("""
                    () => {
                        document.querySelectorAll('[data-radix-collection-item], [role="status"]').forEach(el => el.remove());
                        window.scrollTo(0, 370);
                    }
                """)
                time.sleep(1.0)

            # Let fonts and layout settle
            time.sleep(1.2)
            page.screenshot(path=raw_path)
            print(f"    -> Saved {raw_path}")

        browser.close()
    server.shutdown()
    print("  Fresh screenshots captured successfully!")

# Fonts
def load_font(filename, size):
    paths = [
        os.path.join(r"C:\Windows\Fonts", filename),
        filename
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

FONT_BADGE = load_font("segoeuib.ttf", 25)
FONT_HEAD_SERIF = load_font("georgiab.ttf", 64)
FONT_SUBTITLE = load_font("segoeui.ttf", 29)

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)

def render_showcase(sc, raw_img_path, target_w, target_h, is_ios=True):
    # 1. Base Canvas - Luxury Dark Charcoal & Onyx (#0C0B0A to #151413)
    canvas = Image.new("RGBA", (target_w, target_h), (12, 11, 10, 255))
    draw = ImageDraw.Draw(canvas)

    # Rich vertical subtle dark gradient
    for y in range(target_h):
        ratio = y / target_h
        r = int(12 + (21 - 12) * ratio)
        g = int(11 + (20 - 11) * ratio)
        b = int(10 + (19 - 10) * ratio)
        draw.line([(0, y), (target_w, y)], fill=(r, g, b, 255))

    # Ambient Gold Radial Glow behind the phone
    glow_center_x = target_w // 2
    glow_center_y = int(target_h * 0.58)
    glow_radius = int(target_w * 0.46)
    glow_img = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)

    for r in range(glow_radius, 0, -20):
        alpha = int(35 * (1.0 - (r / glow_radius)) ** 2.0)
        glow_draw.ellipse(
            [(glow_center_x - r, glow_center_y - r), (glow_center_x + r, glow_center_y + r)],
            fill=(245, 158, 11, alpha)
        )
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(40))
    canvas = Image.alpha_composite(canvas, glow_img)
    draw = ImageDraw.Draw(canvas)

    # Subtle Luxury Gold Filigree Header Line at top
    draw.line([(120, 60), (target_w - 120, 60)], fill=(212, 175, 55, 50), width=1)

    # 2. Persian Darbar Crown Logo at top center
    curr_y = 90
    logo_path = os.path.join(PUBLIC_DIR, "persian_darbar_crown_logo.png")
    if os.path.exists(logo_path):
        logo_img = Image.open(logo_path).convert("RGBA")
        logo_size = 90 if target_w >= 1200 else 80
        logo_img = logo_img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        logo_x = (target_w - logo_size) // 2
        canvas.paste(logo_img, (logo_x, curr_y), logo_img)
        curr_y += logo_size + 24

    # 3. Gold Heritage Tag Badge (Precision centered)
    badge_text = sc["badge"]
    badge_bbox = FONT_BADGE.getbbox(badge_text)
    tw = badge_bbox[2] - badge_bbox[0]
    th = badge_bbox[3] - badge_bbox[1]
    badge_w = tw + 48
    badge_h = th + 22
    badge_x = (target_w - badge_w) // 2

    draw_rounded_rect(
        draw,
        [(badge_x, curr_y), (badge_x + badge_w, curr_y + badge_h)],
        radius=14,
        fill=(245, 158, 11, 28),
        outline=(245, 158, 11, 160),
        width=2
    )
    text_x = badge_x + (badge_w - tw) // 2 - badge_bbox[0]
    text_y = curr_y + (badge_h - th) // 2 - badge_bbox[1]
    draw.text((text_x, text_y), badge_text, font=FONT_BADGE, fill=(251, 191, 36, 255))
    curr_y += badge_h + 26

    # 4. Editorial Headline
    # Line 1: Pure Crisp White
    t1_bbox = FONT_HEAD_SERIF.getbbox(sc["title1"])
    t1_w = t1_bbox[2] - t1_bbox[0]
    draw.text(((target_w - t1_w) // 2 - t1_bbox[0], curr_y), sc["title1"], font=FONT_HEAD_SERIF, fill=(255, 255, 255, 255))
    curr_y += 74

    # Line 2: Radiant Persian Gold
    t2_bbox = FONT_HEAD_SERIF.getbbox(sc["title2"])
    t2_w = t2_bbox[2] - t2_bbox[0]
    draw.text(((target_w - t2_w) // 2 - t2_bbox[0], curr_y), sc["title2"], font=FONT_HEAD_SERIF, fill=(245, 158, 11, 255))
    curr_y += 82

    # Subtitle
    sub_bbox = FONT_SUBTITLE.getbbox(sc["subtitle"])
    sub_w = sub_bbox[2] - sub_bbox[0]
    draw.text(((target_w - sub_w) // 2 - sub_bbox[0], curr_y), sc["subtitle"], font=FONT_SUBTITLE, fill=(203, 213, 225, 230))
    curr_y += 65

    # 5. Smartphone Device Mockup (Titanium Frame with Dynamic Island)
    if is_ios:
        phone_w = int(target_w * 0.77)  # ~956px
        phone_h = int(target_h * 0.72)  # ~1935px
    else:
        phone_w = int(target_w * 0.82)  # ~885px
        phone_h = int(target_h * 0.73)  # ~1752px

    phone_x = (target_w - phone_w) // 2
    phone_y = curr_y + 25

    # Multi-layered Realistic Drop Shadow
    shadow_img = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_img)
    shadow_offset_y = 35
    shadow_draw.rounded_rectangle(
        [(phone_x - 12, phone_y + shadow_offset_y - 12),
         (phone_x + phone_w + 12, phone_y + phone_h + shadow_offset_y + 12)],
        radius=72,
        fill=(0, 0, 0, 210)
    )
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(36))
    canvas = Image.alpha_composite(canvas, shadow_img)
    draw = ImageDraw.Draw(canvas)

    # Phone Outer Bezel (Sleek Titanium #27272A with subtle rim)
    draw_rounded_rect(
        draw,
        [(phone_x, phone_y), (phone_x + phone_w, phone_y + phone_h)],
        radius=68,
        fill=(39, 39, 42, 255),
        outline=(82, 82, 91, 255),
        width=3
    )

    # Phone Inner Screen Area
    bezel_padding = 16
    screen_x = phone_x + bezel_padding
    screen_y = phone_y + bezel_padding
    screen_w = phone_w - (bezel_padding * 2)
    screen_h = phone_h - (bezel_padding * 2)

    # Load and scale captured raw screen
    if os.path.exists(raw_img_path):
        raw_screen = Image.open(raw_img_path).convert("RGBA")
        screen_scaled = raw_screen.resize((screen_w, screen_h), Image.Resampling.LANCZOS)

        # Apply screen corner mask
        mask = Image.new("L", (screen_w, screen_h), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([(0, 0), (screen_w, screen_h)], radius=52, fill=255)

        canvas.paste(screen_scaled, (screen_x, screen_y), mask)

        # Dynamic Island Pill at top of screen
        island_w = int(screen_w * 0.28)
        island_h = 34
        island_x = screen_x + (screen_w - island_w) // 2
        island_y = screen_y + 16
        draw_rounded_rect(
            draw,
            [(island_x, island_y), (island_x + island_w, island_y + island_h)],
            radius=17,
            fill=(0, 0, 0, 255)
        )

        # Small camera lens reflection in Dynamic Island
        draw.ellipse([(island_x + island_w - 24, island_y + 9), (island_x + island_w - 8, island_y + 25)],
                     fill=(20, 20, 25, 255))
        draw.ellipse([(island_x + island_w - 20, island_y + 13), (island_x + island_w - 12, island_y + 21)],
                     fill=(10, 10, 15, 255))

    # Convert to RGB (Apple App Store & Play Store require RGB without alpha)
    final_rgb = canvas.convert("RGB")
    return final_rgb

def generate_feature_graphic_1024x500():
    print("Generating Google Play Feature Graphic (1024 x 500)...")
    target_w, target_h = 1024, 500
    canvas = Image.new("RGBA", (target_w, target_h), (12, 11, 10, 255))
    draw = ImageDraw.Draw(canvas)

    # Horizontal gradient
    for x in range(target_w):
        ratio = x / target_w
        r = int(14 + (24 - 14) * ratio)
        g = int(12 + (20 - 12) * ratio)
        b = int(10 + (16 - 10) * ratio)
        draw.line([(x, 0), (x, target_h)], fill=(r, g, b, 255))

    # Ambient Gold Radial Glow
    glow_img = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_draw.ellipse([(150, -50), (650, 450)], fill=(245, 158, 11, 40))
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(50))
    canvas = Image.alpha_composite(canvas, glow_img)
    draw = ImageDraw.Draw(canvas)

    # Crown logo
    logo_path = os.path.join(PUBLIC_DIR, "persian_darbar_crown_logo.png")
    if os.path.exists(logo_path):
        logo_img = Image.open(logo_path).convert("RGBA").resize((90, 90), Image.Resampling.LANCZOS)
        canvas.paste(logo_img, (60, 45), logo_img)

    # Typography
    font_fg_brand = load_font("georgiab.ttf", 38)
    font_fg_headline = load_font("georgiab.ttf", 32)
    font_fg_sub = load_font("segoeui.ttf", 18)
    font_fg_badge = load_font("segoeuib.ttf", 15)

    draw.text((165, 52), "PERSIAN DARBAR", font=font_fg_brand, fill=(255, 255, 255, 255))
    draw.text((165, 104), "ESTD. 1978 · THE ROYAL MUGHLAI FEAST", font=font_fg_badge, fill=(245, 158, 11, 255))

    draw.text((60, 175), "Authentic Shahi Dum Biryani,\nMughlai Raan & Fine Dining", font=font_fg_headline, fill=(251, 191, 36, 255))
    draw.text((60, 295), "Order online in sealed clay handis or reserve luxury tables\nacross Bandra, Andheri, Kurla & Camp Pune.", font=font_fg_sub, fill=(203, 213, 225, 230))

    # Delivery & Quality Trust Chips
    chip_y = 380
    chips = ["4.6+ Star Rated", "Sealed Clay Handis", "Guaranteed Zero Wait"]
    chip_x = 60
    for chip in chips:
        c_bbox = font_fg_badge.getbbox(chip)
        cw = c_bbox[2] - c_bbox[0] + 28
        ch = c_bbox[3] - c_bbox[1] + 16
        draw_rounded_rect(draw, [(chip_x, chip_y), (chip_x + cw, chip_y + ch)], radius=12, fill=(255, 255, 255, 15), outline=(245, 158, 11, 120), width=1)
        draw.text((chip_x + 14, chip_y + 8), chip, font=font_fg_badge, fill=(245, 158, 11, 255))
        chip_x += cw + 14

    # Right side phone preview
    raw_preview = os.path.join(RAW_SCREENS_DIR, "01_home_raw.png")
    if not os.path.exists(raw_preview):
        raw_preview = os.path.join(RAW_SCREENS_DIR, "02_order_raw.png")

    if os.path.exists(raw_preview):
        phone_img = Image.open(raw_preview).convert("RGBA")
        pw, ph = 260, 530
        phone_scaled = phone_img.resize((pw, ph), Image.Resampling.LANCZOS)
        
        mask = Image.new("L", (pw, ph), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([(0, 0), (pw, ph)], radius=34, fill=255)

        # Phone shadow
        shadow_p = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        shadow_p_draw = ImageDraw.Draw(shadow_p)
        shadow_p_draw.rounded_rectangle([(710, 30), (710 + pw + 20, 30 + ph + 20)], radius=40, fill=(0, 0, 0, 210))
        shadow_p = shadow_p.filter(ImageFilter.GaussianBlur(25))
        canvas = Image.alpha_composite(canvas, shadow_p)
        
        canvas.paste(phone_scaled, (720, 25), mask)

    final_rgb = canvas.convert("RGB")
    final_rgb.save(os.path.join(WORKSPACE, "playstore_assets", "feature_graphic_royal_1024x500.png"), quality=95)
    dest_desktop = r"C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar"
    if os.path.exists(dest_desktop):
        final_rgb.save(os.path.join(dest_desktop, "feature_graphic_royal_1024x500.png"), quality=95)

def generate_app_icon_512x512():
    print("Generating Google Play App Icon (512 x 512)...")
    target_size = 512

    # High-end full-bleed luxury slate canvas matching Persian Darbar emblem
    crest_path = os.path.join(PUBLIC_DIR, "persian_darbar_logo_1776079280186.png")
    if os.path.exists(crest_path):
        crest_img = Image.open(crest_path).convert("RGB")
        final_icon = crest_img.resize((target_size, target_size), Image.Resampling.LANCZOS)
    else:
        canvas = Image.new("RGBA", (target_size, target_size), (12, 11, 10, 255))
        draw = ImageDraw.Draw(canvas)
        draw_rounded_rect(
            draw,
            [(16, 16), (496, 496)],
            radius=110,
            fill=(20, 18, 16, 255),
            outline=(212, 175, 55, 255),
            width=12
        )
        logo_path = os.path.join(PUBLIC_DIR, "persian_darbar_crown_logo.png")
        if os.path.exists(logo_path):
            logo_img = Image.open(logo_path).convert("RGBA").resize((320, 320), Image.Resampling.LANCZOS)
            canvas.paste(logo_img, (96, 96), logo_img)
        final_icon = canvas.convert("RGB")

    final_icon.save(os.path.join(WORKSPACE, "playstore_assets", "app_icon_crown_512x512.png"), quality=95)
    dest_desktop = r"C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar"
    if os.path.exists(dest_desktop):
        final_icon.save(os.path.join(dest_desktop, "app_icon_crown_512x512.png"), quality=95)

def main():
    print("=== Generating High-Quality App Store & Play Store Assets ===")
    capture_fresh_screens()

    # Generate iOS 1242 x 2688
    print("\n3. Rendering iOS App Store Graphics (1242 x 2688)...")
    for sc in SCREENS_CONFIG:
        raw_path = os.path.join(RAW_SCREENS_DIR, f"{sc['id']}_raw.png")
        img_ios = render_showcase(sc, raw_path, 1242, 2688, is_ios=True)
        fname = f"{sc['id']}_AppStore_1242x2688.png"
        for d in IOS_DEST_DIRS:
            out_path = os.path.join(d, fname)
            img_ios.save(out_path, quality=95)
            print(f"  Saved iOS: {out_path}")

    # Generate Android 1080 x 2400
    print("\n4. Rendering Google Play Store Graphics (1080 x 2400)...")
    for sc in SCREENS_CONFIG:
        raw_path = os.path.join(RAW_SCREENS_DIR, f"{sc['id']}_raw.png")
        img_android = render_showcase(sc, raw_path, 1080, 2400, is_ios=False)
        fname = f"{sc['id']}_PlayStore_1080x2400.png"
        for d in ANDROID_DEST_DIRS:
            out_path = os.path.join(d, fname)
            img_android.save(out_path, quality=95)
            print(f"  Saved Android: {out_path}")

    # Feature Graphic & App Icon
    generate_feature_graphic_1024x500()
    generate_app_icon_512x512()

    print("\n[SUCCESS] All Store Showcase Graphics generated successfully!")

if __name__ == "__main__":
    main()
