# Persian Darbar — Daily Progress & Upcoming Roadmap

**Date:** 17 October 2026  
**Projects:** Persian Darbar Customer App (iOS & Android)  
**Current iOS Build:** Build 8 (`CURRENT_PROJECT_VERSION = 8`, Version `1.0`)  
**Current Android Sync:** Synced to `android-customer/app/src/main/assets/public`  

---

## 📌 Part 1: What We Accomplished Today (Completed Work)

### 1. iOS Header Safe-Area & Dynamic Island Fix
- **Issue:** On iPhone 14 Pro, 15, and 16, the Dynamic Island was overlapping the top header ("Camp, Pune", branch picker, Royalty button, and avatar).
- **Resolution:** Updated safe-area top padding across all customer screens to `calc(max(env(safe-area-inset-top, 54px), 54px) + 8px)` (giving 62px+ clearance).
- **Affected Files:**
  - `CustomerTopBar.jsx` (Default and Reserve headers)
  - `CustomerLogin.jsx`
  - `CustomerReservations.jsx`
  - `CustomerOrders.jsx`
  - `CustomerSearchExplore.jsx`

### 2. Direct-to-Login Flow on First App Launch
- **Issue:** Unauthenticated users were landing directly on the customer dashboard instead of the login screen.
- **Resolution:**
  - Configured `App.js` routes (`/` and `/customer`) to enforce authentication redirection.
  - Added an unauthenticated guard in `CustomerDashboard.jsx` with an instant clean loader (no dashboard flash) redirecting directly to `/customer/login`.
  - Authenticated users smoothly see the royal startup screen (`CustomerAppSplash`: *"Loading royal menu..."*).

### 3. Native Splash Screen Cleanup
- **Issue:** An unprofessional dark Arabic calligraphy image ("Since 1978 Persian Darbar") was showing during native iOS boot.
- **Resolution:**
  - Removed `<imageView>` from `LaunchScreen.storyboard`.
  - Replaced all images in `Splash.imageset` with solid background assets.
  - Configured `launchShowDuration: 0` and `launchAutoHide: true` in `capacitor.customer.config.json` and iOS config.

### 4. Rewards Page (Royalty Club) UI Overhaul
- **Issue:** Muddy dark/golden card and clipped segmented tabs.
- **Resolution:**
  - Redesigned the PD Coins balance card into a clean, modern, minimalist luxury aesthetic with `#FFFFFF` surface, Persian Darbar Red `#E40000` accents, and a sleek `GOLD VIP` badge (`bg-neutral-950 text-amber-300`).
  - Styled segmented control tabs (`VIP Privileges`, `Redeem Vouchers`, `Coins Passbook`) with solid black active highlight (`bg-neutral-950 text-white shadow-sm font-black rounded-xl`) with zero text clipping.
  - Verified all interactive sections: Daily +25 coins check-in, voucher redemption, passbook transactions, and 4 ways to earn (Delivery, Dine-In, 100-coin Invite modal with WhatsApp share, 50-coin Review modal with rating, and WhatsApp Concierge).

### 5. Brand Identity & Logo Consistency
- **Issue:** A standalone crown logo was appearing instead of the official Persian Darbar brand icon.
- **Resolution:** Integrated the official Persian Darbar app icon (`/app-icon.png` with signature dark luxury background) across:
  - Login page hero header
  - Top bar branch selector (both default and reserve headers)
  - Reservation VIP dining pass
  - Profile tab guest state
  - Customer splash loader

### 6. Dining Date Input Overflow Fix (iOS Safari / WebKit)
- **Issue:** On the table reservation form, the date picker pill was expanding past the card's right border on iOS.
- **Resolution:** Enclosed the `<input type="date">` in a constrained `rounded-2xl overflow-hidden border border-neutral-200/90 bg-neutral-50` container with `-webkit-appearance: none` and `box-border`.

### 7. Profile Tab Sign Out Buttons
- **Issue:** Customers could not log out from their profile.
- **Resolution:**
  - Added a quick Sign Out icon button in the top Patron Profile card next to the edit icon.
  - Added a full-width prominent red-bordered button at the bottom of the profile page: `[🚪 Sign Out of Persian Darbar]`.
  - Implemented an in-app confirmation modal that clears cached credentials and redirects to `/customer/login`.

### 8. Google Sign-In Native Improvements
- **Resolution:** Added native Capacitor platform detection in `CustomerAuthContext.jsx` to attempt popup authentication directly and avoid WebView redirect lockouts, with a 3.5s safety timeout to prevent frozen spinners.

### 9. Dynamic Micro-Animations for Premium Feel
- **Resolution:**
  - 200ms silky fade-in transition when switching between dock tabs (`key={activeTab}`).
  - Spring-scale feedback (`active:scale-90`) on dock navigation buttons.
  - Active tab red micro-dot indicator.

### 10. Multi-Platform Build & Sync
- Bumped iOS build number from 6 to 7 to **Build 8** (`CURRENT_PROJECT_VERSION = 8`).
- Built and synced iOS customer assets (`npm run sync:customer:ios`) and pushed to GitHub `main`.
- Built and synced Android customer assets (`npm run sync:customer`) to `android-customer/app/src/main/assets/public`.

---

## 🚀 Part 2: Upcoming Steps & Action Plan

### Step 1: Uploading iOS Build 8 (Mac / Xcode)
1. Run on Mac:
   ```bash
   git pull origin main
   cd frontend
   npm run build
   npx cap sync ios
   npx cap open ios
   ```
2. In Xcode: Select **Any iOS Device (arm64)** ➔ **Product** ➔ **Archive** ➔ **Distribute App** (TestFlight / App Store) ➔ **Upload**.

---

### Step 2: Android Build for Google Play Console
1. **Verify Versioning in Android Project:**
   - Location: `frontend/android-customer/app/build.gradle`
   - Check and bump `versionCode` (e.g., from current value to next increment) and `versionName` (e.g., `1.0.8`).
2. **Generate Release Android App Bundle (AAB):**
   - Run in `frontend/android-customer`:
     ```bash
     ./gradlew bundleRelease
     ```
   - Verify signing using the production release keystore (`.keystore` / `.jks`).
3. **Upload to Google Play Console:**
   - Navigate to Google Play Console ➔ Select Persian Darbar Customer App.
   - Go to **Production** or **Internal Testing / Closed Testing**.
   - Create new release and upload the signed `.aab` file located at:  
     `frontend/android-customer/app/build/outputs/bundle/release/app-release.aab`.

---

### Step 3: Google Play Store Assets & Graphics Checklist
1. **App Icon:**
   - 512 x 512 px PNG (32-bit color, max 1MB).
   - Use official Persian Darbar logo asset.
2. **Feature Graphic:**
   - 1024 x 500 px PNG or JPEG (16:9 ratio, max 15MB, no transparency).
   - Showcases authentic Dum Biryani, Persian feast aesthetic, and "Since 1978".
3. **Phone Screenshots:**
   - Minimum 2, recommended 4-6 screenshots.
   - Resolution: 1080 x 2400 px or 1242 x 2688 px (9:16 aspect ratio).
   - Suggested Screens:
     1. *Royal Home Screen* (Biryani specials, 4 branch picker, weekend deals).
     2. *Food Menu & Customization* (Mutton Persian Special, Kebabs, Dum Biryani).
     3. *VIP Dining Reservation* (Live table confirmation pass, dining moods).
     4. *Royalty Club & PD Coins* (Modern minimalist card, 10% cashback, voucher redemption).
     5. *Live Order Tracking* (Map, delivery partner status).
4. **Store Listing Copy:**
   - **App Title:** Persian Darbar Original
   - **Short Description (80 chars):** Authentic Persian & Mughlai Cuisine. Biryanis, Kebabs & Royal Dining Since 1978.
   - **Full Description:** Detailing 4 official branches (Bandra, Andheri, Kurla, Camp Pune), online ordering, table reservations, and Royalty Club membership.
   - **Category:** Food & Drink.
   - **Privacy Policy URL:** `https://www.persiandarbar.in/privacy-policy`
   - **Account Deletion URL:** `https://www.persiandarbar.in/delete-account`
