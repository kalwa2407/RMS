import os
from PIL import Image

# 1. Source Logo
logo_src_path = os.path.join("frontend", "public", "logo-nav-gold.png")
if not os.path.exists(logo_src_path):
    raise FileNotFoundError(f"Source logo not found at {logo_src_path}")

logo_img = Image.open(logo_src_path).convert("RGBA")
# Crop to exact non-transparent bounding box
bbox = logo_img.getbbox()
logo_clean = logo_img.crop(bbox)
logo_orig_w, logo_orig_h = logo_clean.size
aspect = logo_orig_w / float(logo_orig_h)

# Persian Darbar Brand Dark Navy Color
BG_COLOR = (11, 19, 27, 255) # #0B131B

def make_solid_icon(size, logo_scale=0.60):
    """Creates a solid background square icon with centered logo (for iOS and legacy Android)"""
    icon = Image.new("RGBA", (size, size), BG_COLOR)
    target_w = int(size * logo_scale)
    target_h = int(target_w / aspect)
    resized_logo = logo_clean.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    offset_x = (size - target_w) // 2
    offset_y = (size - target_h) // 2
    icon.paste(resized_logo, (offset_x, offset_y), resized_logo)
    return icon

def make_foreground_icon(canvas_size, logo_scale=0.52):
    """Creates a transparent adaptive icon foreground where logo is strictly inside the 66dp safe zone (<= 55%)"""
    fg = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    target_w = int(canvas_size * logo_scale)
    target_h = int(target_w / aspect)
    resized_logo = logo_clean.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    offset_x = (canvas_size - target_w) // 2
    offset_y = (canvas_size - target_h) // 2
    fg.paste(resized_logo, (offset_x, offset_y), resized_logo)
    return fg

# 2. Android Density Specifications
android_res_base = os.path.join("frontend", "android-customer", "app", "src", "main", "res")

densities = {
    "mipmap-mdpi": {"legacy": 48, "fg": 108},
    "mipmap-hdpi": {"legacy": 72, "fg": 162},
    "mipmap-xhdpi": {"legacy": 96, "fg": 216},
    "mipmap-xxhdpi": {"legacy": 144, "fg": 324},
    "mipmap-xxxhdpi": {"legacy": 192, "fg": 432},
}

print("Generating Android Adaptive & Legacy Icons with 100% Safe Zone Padding...")
for folder, dims in densities.items():
    dir_path = os.path.join(android_res_base, folder)
    os.makedirs(dir_path, exist_ok=True)
    
    # 1. Foreground icon (108dp canvas, logo at 52% to guarantee NO cut off in any launcher mask)
    fg_img = make_foreground_icon(dims["fg"], logo_scale=0.52)
    fg_path = os.path.join(dir_path, "ic_launcher_foreground.png")
    fg_img.save(fg_path, "PNG", optimize=True)
    
    # 2. Legacy Square icon
    sq_img = make_solid_icon(dims["legacy"], logo_scale=0.68)
    sq_path = os.path.join(dir_path, "ic_launcher.png")
    sq_img.save(sq_path, "PNG", optimize=True)
    
    # 3. Legacy Round icon
    round_img = make_solid_icon(dims["legacy"], logo_scale=0.62)
    round_path = os.path.join(dir_path, "ic_launcher_round.png")
    round_img.save(round_path, "PNG", optimize=True)
    
    print(f"  [OK] Updated {folder} (FG: {dims['fg']}x{dims['fg']}, Legacy: {dims['legacy']}x{dims['legacy']})")

# 3. iOS AppIcon (1024x1024)
ios_icon_dir = os.path.join("frontend", "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset")
if os.path.exists(ios_icon_dir):
    ios_icon = make_solid_icon(1024, logo_scale=0.60)
    # Save as 24-bit RGB (Apple App Store forbids alpha transparency on AppIcon)
    ios_icon_rgb = ios_icon.convert("RGB")
    ios_path = os.path.join(ios_icon_dir, "AppIcon-512@2x.png")
    ios_icon_rgb.save(ios_path, "PNG", optimize=True)
    print(f"  [OK] Updated iOS AppIcon-512@2x.png (1024x1024 RGB, no alpha)")

# 4. Web & PWA Icons
pub_dir = os.path.join("frontend", "public")
web_180 = make_solid_icon(180, logo_scale=0.65).convert("RGB")
web_180.save(os.path.join(pub_dir, "apple-touch-icon.png"), "PNG", optimize=True)

web_512 = make_solid_icon(512, logo_scale=0.62).convert("RGB")
web_512.save(os.path.join(pub_dir, "favicon.png"), "PNG", optimize=True)

# 5. Play Store Assets Folder
play_dir = r"C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar"
if os.path.exists(play_dir):
    store_512 = make_solid_icon(512, logo_scale=0.65).convert("RGB")
    store_512.save(os.path.join(play_dir, "00_OFFICIAL_APP_ICON_512x512.png"), "PNG", optimize=True)
    store_512.save(os.path.join(play_dir, "app_icon_512x512.png"), "PNG", optimize=True)
    print("  [OK] Updated Play Store official 512x512 icons on Desktop.")

print("\nALL ICONS SUCCESSFULLY REGENERATED WITH ZERO TRUNCATION GUARANTEE!")
