# 👑 PERSIAN DARBAR — MASTER DEPLOYMENT & CREDENTIALS VAULT

> **Document Created:** October 13, 2026  
> **Project:** Persian Darbar Restaurant Management System (RMS) & Mobile Apps  
> **Repository:** `https://github.com/kalwa2407/RMS.git` (Branch: `main`)  
> **Status Overview:** Android Submitted (In Review) · iOS Awaiting Account Verification  

---

## 📊 CURRENT DEPLOYMENT STATUS

| Platform | Component | Target Bundle / Package ID | Current Status | Next Action / ETA |
| :--- | :--- | :--- | :--- | :--- |
| 🤖 **Android** | Customer App | `in.persiandarbar.customer` | **IN REVIEW (Google Play Inspection)** | Live automatically in 2–5 days (`Managed publishing off`) |
| 🍏 **iOS** | Customer App | `in.persiandarbar.customer` | **Awaiting Apple ID Verification** | ID documents submitted; approval expected in 12–24h |
| 🌐 **Backend API** | Google Cloud Run | `tasteofhindustan-api-...` | **Active & Running** | `https://tasteofhindustan-api-63332283509.asia-south1.run.app` |
| 🌐 **Frontend Web** | Vercel | `persiandarbar.in` | **Active & Running** | Production domain live with PWA capability |

---

## 🔐 CRITICAL KEYS, PASSWORDS & CREDENTIALS

### 1. Android Release Keystore (Google Play Signing)
> ⚠️ **CRITICAL:** Do NOT lose this keystore or password. Without it, you cannot release app updates on Google Play!

* **Keystore Files:**
  * Customer App: `frontend/android-customer/app/persian-darbar-release.keystore`
  * Staff App: `frontend/android/app/persian-darbar-release.keystore`
* **Keystore Alias:** `persian-darbar`
* **Keystore Password:** `PD@Release2026!`
* **Key Password:** `PD@Release2026!`
* **Algorithm / Validity:** RSA 2048-bit, PKCS12, Valid for 10,000 days (~27 years)
* **SHA1 Fingerprint:** `31:75:79:F7:61:B7:4A:EC:94:47:D2:A0:C6:13:89:5C:7B:DB:C4:D9`

### 2. Apple Developer & App Store Credentials
* **Account Holder:** Vijay Choudhary
* **Account Type:** Apple Developer Program (Individual)
* **Status:** Government ID (Aadhaar / Proof) submitted for verification
* **App Store Bundle Identifier:** `in.persiandarbar.customer`
* **App Display Name:** `Persian Darbar`
* **App SKU:** `persiandarbar-customer-01`
* **Primary Language:** `English (U.S.)`

### 3. Meta WhatsApp Cloud API & Services
* **WhatsApp Phone Number ID:** `2681861995237690` (+91 95942 87868)
* **WhatsApp Business Account ID (WABA):** `207051877129638`
* **Graph API Version:** `v20.0`
* **Webhook Endpoint:** `https://tasteofhindustan-api-63332283509.asia-south1.run.app/api/whatsapp/webhook`
* **Restaurant Location (Pune):** Latitude `18.5126`, Longitude `73.8785` (Camp, Pune)

---

## 🎨 STORE LISTING METADATA & ASSETS

All production-grade store listing assets are backed up in:
📁 `C:\Users\Aman Talukdar\Desktop\PlayStore_Assets_PersianDarbar`

### Assets Catalog
| File Name | Dimensions | Purpose |
| :--- | :--- | :--- |
| `00_OFFICIAL_APP_ICON_512x512.png` | 512 x 512 px | Official Google Play & App Store Icon (Dark Navy `#0b131b` + Minarets) |
| `app_icon_gold_512x512.png` | 512 x 512 px | Alternate Gold Emblem App Icon |
| `feature_graphic_royal_1024x500.png` | 1024 x 500 px | Royal Dining Ambience + Gold Logo Feature Banner |
| `01_Customer_App_Home.png` | 1080 x 2400 px | Customer App Dashboard Screenshot |
| `02_Customer_App_Order.png` | 1080 x 2400 px | In-App Food Ordering & Categories Screenshot |
| `03_Customer_App_Reserve.png` | 1080 x 2400 px | Table Reservation & VIP Dining Screenshot |
| `04_Customer_App_Rewards.png` | 1080 x 2400 px | PD Coins & Loyalty Privilege Screenshot |
| `05_Customer_App_Profile.png` | 1080 x 2400 px | Privilege Passport & Customer Profile Screenshot |
| `app-release.aab` | 13.98 MB | Digitally Signed Production App Bundle (Version 1.0, Target SDK 36) |

### Copywriting Text

#### App Name
```text
Persian Darbar
```

#### Short Description (75 Characters)
```text
Order royal Persian & Mughlai cuisine, reserve tables & earn reward coins.
```

#### Full Description
```text
Experience royal dining at your fingertips with the official Persian Darbar mobile app. Renowned for authentic Persian, Mughlai, and North Indian delicacies since 1978, Persian Darbar brings signature culinary heritage directly to your smartphone.

Whether you are craving our legendary Biryanis, tender melt-in-the-mouth Kebabs, royal Raan, or rich gravies, our app delivers a seamless and premium dining experience.

👑 KEY FEATURES:

1. 🍲 Order Online with Ease:
Explore our complete menu with rich descriptions, dietary tags (Veg / Non-Veg / Halal), and customizable options. Add items to cart and check out in seconds.

2. 🚀 Live Order Tracking:
Track your order journey in real-time from our kitchen to your doorstep with instant status notifications.

3. 🍽️ Table Reservation & VIP Dining:
Reserve tables for family dinners, dates, or royal gatherings in advance. Select your preferred date, time slot, and guest count with zero waiting time.

4. 🪙 PD Coins & Royalty Rewards:
Earn reward coins on every order and table booking. Redeem your coins for exclusive discounts and complimentary dishes.

5. 💳 Fast & Secure Payments:
Multiple payment options including UPI, Credit/Debit cards, Net Banking, and Cash on Delivery. 100% secure 256-bit encrypted transactions.

6. 📍 Real-Time Location & Multiple Addresses:
Save multiple delivery addresses (Home, Office, Party) and pinpoint your precise location for faster delivery.

Indulge in royal flavors today. Download the official Persian Darbar app now!
```

---

## 🛡️ NATIVE LAUNCH PROTECTION (Zero-Website Leak Guarantee)

To guarantee that Google Play and Apple App Store reviewers never see the public desktop website:
1. **Layer 1 (Pre-injected Mode):** `<script>window.__RMS_APP_MODE__="customer";</script>` is permanently injected in `index.html` of both `android-customer` and `ios`.
2. **Layer 2 (Native Package Guard):** `NativeRootRedirect` in `App.js` checks `CapApp.getInfo().id === "in.persiandarbar.customer"` and immediately forces navigation to `/customer/dashboard`.
3. **Layer 3 (Back-Button & Fallback Lock):**
   - Hardware Android back button on `/customer/dashboard` directly calls `CapApp.exitApp()`.
   - Login screen in standalone mode renders *"Explore Menu as Guest"* directly to `/customer/dashboard` (disabling "Return to Main Site").
   - Catch-all 404 route in standalone mode redirects to `CustomerDashboard` rather than the web 404 page.

---

## 🍏 WHAT TO DO ONCE APPLE APPROVES (Next Step Playbook)

As soon as Apple sends the approval email (*"Your membership is active"*):

1. **On Mac Terminal:**
   ```bash
   cd ~/Desktop/RMS/frontend
   git pull origin main
   npm run sync:customer:ios
   ```

2. **Open in Xcode:**
   ```bash
   open ios/App/App.xcodeproj
   ```

3. **In Xcode:**
   - Go to **App** (blue icon) ➡️ **Signing & Capabilities**.
   - **Team** dropdown me apna approved paid Apple Developer account select karein.
   - Bundle ID: `in.persiandarbar.customer`.
   - Top bar device: **`Any iOS Device (arm64)`**.
   - Top menu: **Product ➡️ Archive**.
   - Organizer window me: **Distribute App ➡️ App Store Connect ➡️ Upload**!

4. **In App Store Connect (`appstoreconnect.apple.com`):**
   - Click **My Apps ➡️ `+` ➡️ New App**.
   - Name: `Persian Darbar`
   - Bundle ID: `in.persiandarbar.customer`
   - Paste the descriptions from this vault and attach the screenshots.
   - Click **Submit for Review**!
