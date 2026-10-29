---
name: apple-design-system
description: >-
  Expert guidelines and utility patterns for creating 10/10 Apple Human Interface Guidelines (HIG)
  and iOS-grade interfaces: spring animations, glassmorphism, squircle geometry, tactile haptic
  press effects, frosted blur layers, and SF Pro typography hierarchy.
---

# Apple Design System & iOS Human Interface Guidelines (HIG)

This skill provides comprehensive instructions for designing, polishing, and delivering 10/10 iOS-grade web and native hybrid applications that feel indistinguishable from first-party Apple apps.

---

## 1. Core Principles of Apple Aesthetics

### 1.1 Tactile Spring Motion (60fps Physics)
- Avoid linear or standard ease transitions. Use Apple spring physics curves:
  - **Press/Tap Scale**: `cubic-bezier(0.25, 1, 0.5, 1)` or `active:scale-[0.96] transition-all duration-200`
  - **Modal / Sheet In**: `cubic-bezier(0.32, 0.72, 0, 1)`
  - **Bouncy Popovers**: `cubic-bezier(0.175, 0.885, 0.32, 1.275)`

### 1.2 Frosted Glass & Vibrant Materials
- Real-world iOS interfaces use layered translucent materials rather than opaque flat backgrounds:
  - **Floating Bars / Docks**: `backdrop-blur-2xl bg-white/80 border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.08)]`
  - **Cards**: `bg-white/95 backdrop-blur-md border border-black/[0.05] shadow-[0_2px_12px_rgba(0,0,0,0.04)]`
  - **Dark / VIP Elements**: `bg-neutral-900/95 backdrop-blur-xl text-white border border-white/10`

### 1.3 Squircle Geometry (Continuous Curves)
- iOS avoids harsh sharp rectangles. Standard corner radii:
  - Small chips & badges: `rounded-xl` (12px)
  - Cards & list items: `rounded-2xl` (16px) or `rounded-3xl` (24px)
  - Floating sheets & bottom docks: `rounded-3xl` (28px - 32px)

### 1.4 System Colors & Dynamic Grouping
- **Background grouped**: `#F2F2F7` (iOS systemGroupedBackground)
- **Card surface**: `#FFFFFF` with `border-black/[0.05]`
- **Primary Brand Accent**: Persian Darbar Royal Crimson (`#E40000` / `#D31027`) balanced with warm royal amber gold (`#F59E0B` / `#D97706`).
- **Typography hierarchy**:
  - Title: `-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`, font-black / font-extrabold
  - Body: font-medium, text-neutral-800
  - Subtitle / Meta: font-semibold, text-neutral-500, tracking-tight

---

## 2. Standard Reusable CSS Utilities

```css
/* Tactile Apple Press Effect */
.ios-press {
  transition: transform 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.16s ease;
  user-select: none;
  -webkit-user-select: none;
}
.ios-press:active {
  transform: scale(0.96);
  opacity: 0.9;
}

/* Glassmorphic Floating Dock */
.ios-glass-dock {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
}

/* iOS Card Elevation */
.ios-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02);
  border-radius: 1.5rem;
}
```

---

## 3. Checklist for 10/10 Polish
- [x] Smooth inertia scrolling on all overflow containers (`-webkit-overflow-scrolling: touch`)
- [x] No elastic overscroll flashes (`overscroll-behavior: none`)
- [x] Every button has immediate tactile scale feedback (`active:scale-95` or `.ios-press`)
- [x] Delicate hairline borders (`border-black/[0.05]` or `border-white/20`) instead of heavy opaque lines
- [x] Dynamic Island / status bar area respects `env(safe-area-inset-top)` with translucent blur
- [x] Clean, high-contrast action buttons with soft ambient colored glow shadows
