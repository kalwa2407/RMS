import os
from PIL import Image

SRC_DIR = r"C:\Users\Aman Talukdar\Desktop\RestaurantManagementSystem\playstore_assets\AppStore_Showcase_Graphics"

OUT_1179_DESKTOP = r"C:\Users\Aman Talukdar\Desktop\AppStore_Screenshots_1179x2556"
OUT_1290_DESKTOP = r"C:\Users\Aman Talukdar\Desktop\AppStore_Screenshots_1290x2796"
OUT_1179_REPO    = r"C:\Users\Aman Talukdar\Desktop\RestaurantManagementSystem\playstore_assets\AppStore_Screenshots_1179x2556"
OUT_1290_REPO    = r"C:\Users\Aman Talukdar\Desktop\RestaurantManagementSystem\playstore_assets\AppStore_Screenshots_1290x2796"

for folder in [OUT_1179_DESKTOP, OUT_1290_DESKTOP, OUT_1179_REPO, OUT_1290_REPO]:
    os.makedirs(folder, exist_ok=True)

files = [
    "01_home_AppStore_1242x2688.png",
    "02_order_AppStore_1242x2688.png",
    "03_reserve_AppStore_1242x2688.png",
    "04_vip_pass_AppStore_1242x2688.png",
    "05_rewards_AppStore_1242x2688.png",
]

print("Starting Lanczos resizing for App Store Connect...")

for fname in files:
    src_path = os.path.join(SRC_DIR, fname)
    if not os.path.exists(src_path):
        print(f"File not found: {src_path}")
        continue

    with Image.open(src_path) as img:
        print(f"\nProcessing {fname} (original: {img.size})...")
        
        # 1. Resize to 1179 x 2556 (iPhone with Dynamic Island 6.1" / 6.3")
        img_1179 = img.resize((1179, 2556), Image.Resampling.LANCZOS)
        out_name_1179 = fname.replace("1242x2688", "1179x2556")
        img_1179.save(os.path.join(OUT_1179_DESKTOP, out_name_1179), "PNG", optimize=True)
        img_1179.save(os.path.join(OUT_1179_REPO, out_name_1179), "PNG", optimize=True)
        print(f"  -> Generated 1179x2556: {out_name_1179} ({img_1179.size})")

        # 2. Resize to 1290 x 2796 (iPhone with Dynamic Island large 6.7" / 6.9")
        img_1290 = img.resize((1290, 2796), Image.Resampling.LANCZOS)
        out_name_1290 = fname.replace("1242x2688", "1290x2796")
        img_1290.save(os.path.join(OUT_1290_DESKTOP, out_name_1290), "PNG", optimize=True)
        img_1290.save(os.path.join(OUT_1290_REPO, out_name_1290), "PNG", optimize=True)
        print(f"  -> Generated 1290x2796: {out_name_1290} ({img_1290.size})")

print("\nSuccessfully generated all App Store Connect screenshots in perfect dimensions!")
