---
name: Appetite Native
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1b1b'
  on-surface-variant: '#5b403f'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#8f6f6e'
  outline-variant: '#e4bebc'
  surface-tint: '#bb162c'
  primary: '#b7122a'
  on-primary: '#ffffff'
  primary-container: '#db313f'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb3b1'
  secondary: '#006e26'
  on-secondary: '#ffffff'
  secondary-container: '#8af793'
  on-secondary-container: '#007328'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cca830'
  on-tertiary-container: '#4f3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001c'
  secondary-fixed: '#8dfa96'
  secondary-fixed-dim: '#71dd7c'
  on-secondary-fixed: '#002106'
  on-secondary-fixed-variant: '#00531b'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#fcf9f8'
  on-background: '#1b1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 25px
    letterSpacing: -0.008em
  title-md:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  title-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.004em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.025em
  caption-xs:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system expresses a vibrant, hyper-fast, and crave-inducing consumer food-tech experience tailored strictly for iOS native design sensibilities. It bridges operational efficiency with editorial visual delight, combining the energetic, recognizable identity of on-demand food delivery with Apple's Human Interface Guidelines (HIG).

### Brand Personality & Emotional Impact
- **Hungry & Vibrant:** Driven by appetizing crimson highlights that ignite craving, urgency, and decisive action.
- **Effortless & Frictionless:** Ultra-clear hierarchy, immediate visual cues, and ergonomic touch targets built for one-handed thumb navigation while walking or on the move.
- **Premium & Rewarding:** High-tier loyalty surfaces treated with deep metallic golds, elegant status Badging, and subtle luster to convey exclusivity.
- **Dependable & Transparent:** Real-time feedback, distinct state transitions, and accessible rating badges that establish trust at a glance.

### Design Aesthetic
The aesthetic balances **Modern iOS HIG Native** with **Tactile Consumer Surfaces**. It features pristine optical whites (`#FFFFFF`), whisper-soft structural background layers (`#F8F9FA`), razor-thin hairline dividers (`#EEEEEE`), generous border radii, fluid spring-physics transitions, and native system-level visual treatments (such as contextual blur materials and crisp edge definition).

## Colors

The color palette is architected for immediate visual triage, separating transactional drivers, status alerts, premium membership tiers, and structural backgrounds.

### Primary: Brand Red
- **Primary Base (`#E23744`):** The signature brand accent. Used for primary CTAs, active tab icons, delivery tracking markers, and prominent interactive triggers.
- **Primary Light / Hover (`#EF4F5F`):** Used for interactive press states and dynamic promotional badges.
- **Primary Dark (`#CB202D`):** Used for active press states, pressed button fills, and high-contrast text links on soft tinted backgrounds.
- **Primary Tint Surface (`#FDECEE`):** Extremely soft crimson wash used for active pill filters, coupon containers, and offer backgrounds.

### Supporting Semantics
- **Success / Rating Green (`#24963F`):** The high-trust rating badge fill for scores ≥ 4.0, vegetarian dietary indicators, and successful transaction banners.
- **Rating Green Dark (`#1C7A32`):** Used for rating text labels and compact data rows.
- **Rating Tint (`#EAF5ED`):** Subtle background fill for positive merchant feedback and eco-friendly delivery tags.
- **Gold Tier (`#D4AF37` / `#B8860B`):** Metallic gold reserved strictly for Gold VIP membership tags, crown badges, priority perks, and exclusive member dining privileges.
- **Gold Tint / Dark Gold (`#1A1710` surface with `#E5C158` text):** Used for ultra-premium loyalty cards and splashy event carousels.
- **Offer / Info Blue (`#256FEF`):** Dedicated to bank promotions, digital payment discounts, and standard informational tags.

### Neutrals & System Surfaces
- **Canvas Default (`#FFFFFF`):** Pure white base for cards, sheets, headers, and modal surfaces.
- **Surface Muted / Grouped Background (`#F8F9FA`):** iOS secondary system grouped background fill for list gutters and screen-level backdrops.
- **Surface Subtle (`#F4F5F7`):** Tertiary card fills, inactive pills, and input background fills.
- **Border Subtle (`#EEEEEE`):** Standard 0.5pt to 1pt hairline card boundaries and dividers.
- **Border Structural (`#E2E8F0`):** Input field borders and inactive segmented control tracks.
- **Text Dominant (`#1C1C1C`):** High-contrast primary headings, restaurant names, and prices.
- **Text Secondary (`#363636`):** Dish descriptions, secondary metadata, and modal bodies.
- **Text Tertiary (`#696969`):** Delivery times, sub-labels, and metadata attributes.
- **Text Disabled / Hint (`#9C9C9C`):** Placeholder text, inactive tab labels, and unselected indicators.

## Typography

The typography is built around clean, neutral, and highly legible grotesque sans-serif metrics mirroring Apple's native SF Pro system (`-apple-system`, `SF Pro Text`, `SF Pro Display`, falling back to `Inter`).

### Hierarchy & Typesetting Guidelines
- **Display & Section Titles (`display-lg`, `headline-lg`):** Reserved for top-level discovery sections, major campaign headers, and dynamic home greetings. Characterized by negative letter tracking for a tight, high-impact native iOS presentation.
- **Card Titles & Restaurant Names (`title-md`):** Fixed at 17px Semi-Bold (`-0.005em` tracking) to match iOS navigation titles and card headers, prioritizing scannability in horizontal scrolling lists.
- **Price Displays:** Always typeset in bold (`title-md` or `label-lg`) paired with currency symbols in matching weights to maintain visual continuity.
- **Micro-Badges & Rating Pills (`label-md`, `label-sm`):** Compact, high-legibility typographic tokens featuring uppercase or title-case text with a slight positive tracking bonus for maximum clarity inside filled green, red, or gold badge boundaries.

## Layout & Spacing

Layout follows iOS Human Interface screen bounds with continuous horizontal padding and vertical modularity.

### Layout Mechanics
- **Safe Area Insets:** The layout respects strict native bounds: 44pt to 59pt top inset (accounting for Dynamic Island / notch) and 34pt bottom home indicator clearance.
- **Canvas Margins:** Screen gutters are fixed at `margin` (16pt / `1rem`), providing content framing against edge bezels.
- **Feed Rhythm:** Primary cards are spaced vertically by `space-xl` (24pt / `1.5rem`) on top-level grouped views, while internal card components scale along `space-xs` (4pt), `space-sm` (8pt), and `space-md` (12pt).
- **Horizontal Carousels:** Edge-to-edge full bleed carousels feature `margin` (16pt) inset snaps, clipping smoothly at left and right display borders.

## Elevation & Depth

Depth in this system is engineered through clean white card layering, low-contrast boundaries, and diffused ambient illumination. It avoids murky, unrefined drop shadows in favor of crisp, modern iOS styling.

### Elevation Hierarchy
- **Level 0 (Flat Canvas):** `#F8F9FA` or `#FFFFFF` base canvas. Zero shadow; structural hierarchy is maintained through subtle hairlines (`#EEEEEE` 1px border).
- **Level 1 (Card Resting):** Used for restaurant feed tiles, menu items, and list cells. Rendered with a pure `#FFFFFF` background, a hairline stroke (`#EEEEEE`), and an ultra-subtle ambient drop shadow: `0px 2px 8px rgba(0, 0, 0, 0.04)`.
- **Level 2 (Floating Action & Filter Sticky):** Sticky search bars, floating filter chips, and bottom cart summaries. Rendered with `0px 4px 16px rgba(0, 0, 0, 0.08)` accompanied by iOS system standard background blur (`UIBlurEffectStyleSystemChromeMaterialLight` / `backdrop-filter: blur(20px)` at 85% opacity).
- **Level 3 (Modals & Bottom Sheets):** Native modal half-sheets, customization overlays, and sorting drawers. Rendered with `0px -4px 24px rgba(0, 0, 0, 0.12)`, anchored over a dim scrim (`rgba(0, 0, 0, 0.45)`).

## Shapes

The geometric vocabulary balances rounded rectangle card architecture (`16px` to `20px`) with continuous full-radius pill silhouettes (`9999px`) for metadata, ratings, and action controls.

### Geometry Application
- **Pills (`rounded-full` / `9999px`):** Reserved for dynamic metadata badges, ratings, delivery time markers, category filters, and active tab indicators.
- **Card Structures (`16px` / `rounded-lg`):** Standard for restaurant showcase cards, order history containers, and promo banners.
- **Bottom Sheets & Modal Dialogs (`24px` top corners):** Accompanied by a 4px × 36px centered grab handle (`#D1D5DB`) with a `9999px` radius.
- **Food Imagery Radii (`12px` to `16px`):** Dish thumbnails inside cards maintain soft interior curvature matching their host container's corner radius.

## Components

### Buttons
- **Primary CTA:** Full-width or inline rounded button (`12px` or `9999px` pill radius), 48pt–52pt height for comfortable iOS tapping. Background `#E23744`, text `#FFFFFF` (`label-lg`), with active press compression (`scale(0.98)`).
- **Secondary / Ghost Button:** Transparent background, 1pt border `#EEEEEE` or `#E2E8F0`, text `#1C1C1C`.
- **Add to Cart Stepper Button:** Pill container (`32pt` height) with `#FFFFFF` fill, `#E23744` 1pt outline, and `#E23744` bold text. Includes animated expansion to minus/quantity/plus states upon selection.

### Search Bar (Native iOS Inspired)
- Height: 44pt.
- Background: `#F4F5F7` with 12px corner radius or full pill curvature.
- Left Accessory: Search glyph (`18pt`, `#E23744` or `#696969`).
- Content: Placeholder text in `#9C9C9C` (`body-md`).
- Right Accessory: Vertical hairline divider (`16pt` height, `#E2E8F0`) followed by a native microphone icon (`#E23744`).

### Chips & Filter Pills
- Resting: Height 32pt, pill-shaped (`9999px`), `#FFFFFF` background, 1pt hairline `#E2E8F0` border, text `#363636` (`label-md`).
- Active: Background `#FDECEE`, border `#E23744` (1pt), text `#E23744` (`label-md`). Optional trailing "close" cross glyph.

### Badges & Status Indicators
- **Rating Pill Badge:** Compact pill (`space-xs` padding vertical, `space-sm` horizontal), background `#24963F`, text `#FFFFFF` (`label-sm`). Prefixed or suffixed with a crisp solid white 5-point star (`10pt`).
- **Delivery Time & Distance Badge:** `#F4F5F7` background, text `#363636` (`label-sm`), featuring a leading 12pt clock or delivery bag glyph.
- **Gold Membership Badge:** Gradient fill (`#2A2416` to `#14120C`), border 1pt `#D4AF37`, text `#F3D77B` (`label-sm` with letter spacing `0.05em`), paired with an embossed crown icon.
- **Offer Ribbon Tag:** Attached directly to card bases or promotional headers. Blue variant: `#256FEF` fill with white text. Red variant: `#E23744` fill or `#FDECEE` fill with `#CB202D` text.

### Cards
- **Restaurant Card:** White container (`#FFFFFF`), `16px` corner radius, `Level 1` elevation. Top hero aspect ratio 16:9 with overlaid rating pill, favorite heart icon (blurred frosted backing), and offer ribbon tag at the bottom-left image edge. Lower container features restaurant title, cuisine tags, estimated delivery time, and distance subtext.
- **Dish / Menu Item Card:** Horizontal row, two-column split layout. Left side: Veg/Non-Veg icon marker, dish name, price, description, and custom tag. Right side: `120pt × 120pt` curved dish image (`12px` radius) with an overlapping absolute-positioned "ADD" button centered on the lower edge.

### Checkboxes, Radios, & Dietary Markers
- **Veg Marker:** 14pt green square border (`#24963F`) with an inner green circular dot (`6pt`).
- **Non-Veg Marker:** 14pt red/brown square border (`#CB202D`) with an inner solid red triangle (`6pt`).
- **iOS Radio / Checkboxes:** Native rounded style, filling with `#E23744` upon activation and featuring an animated check icon.

### Bottom Navigation Bar (iOS Tab Bar)
- Height: 49pt + 34pt safe area bottom inset.
- Visual Treatment: Translucent frosted blur background (`#FFFFFF` at 88% opacity with `backdrop-filter: blur(20px)`), anchored by a 0.5pt hairline border `#EEEEEE` along the top edge.
- Four Core Tabs:
  1. **Delivery:** Bag/scooter icon.
  2. **Dining / Re-order:** Plate/clock repeat icon.
  3. **Live / Money:** Sparkle/wallet icon.
  4. **Profile:** Avatar outline icon.
- States: Active tab shows brand color `#E23744` for icon and text with an optional micro-indicator bar beneath; inactive tabs display `#9C9C9C`.