---
name: Creative Media Nexus
colors:
  surface: '#10131c'
  surface-dim: '#10131c'
  surface-bright: '#363943'
  surface-container-lowest: '#0b0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#272a34'
  surface-container-highest: '#32343f'
  on-surface: '#e0e2ef'
  on-surface-variant: '#e3beb3'
  inverse-surface: '#e0e2ef'
  inverse-on-surface: '#2d303a'
  outline: '#aa897f'
  outline-variant: '#5b4138'
  surface-tint: '#ffb59d'
  primary: '#ffb59d'
  on-primary: '#5d1900'
  primary-container: '#ff5e1e'
  on-primary-container: '#561600'
  inverse-primary: '#ab3500'
  secondary: '#d2bcff'
  on-secondary: '#3e008e'
  secondary-container: '#7002f5'
  on-secondary-container: '#dbc8ff'
  tertiary: '#00daf3'
  on-tertiary: '#00363d'
  tertiary-container: '#00a2b5'
  on-tertiary-container: '#003138'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59d'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#832700'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bcff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5900c7'
  tertiary-fixed: '#9cf0ff'
  tertiary-fixed-dim: '#00daf3'
  on-tertiary-fixed: '#001f24'
  on-tertiary-fixed-variant: '#004f58'
  background: '#10131c'
  on-background: '#e0e2ef'
  surface-variant: '#32343f'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 68px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 46px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
This design system defines an electric, high-end creative agency experience tailored for next-generation media production, bridging youthful talent energy with enterprise-grade project execution. 

The aesthetic is characterized by:
- **Futuristic Glassmorphic Dark UI**: Deep cosmic obsidian and dark navy foundations illuminated by high-chroma neon accents.
- **Cinematic Contrast**: Dark charcoal containers layered over midnight backdrops, accented with vivid orange fire and electric violet ultraviolet pulses.
- **Precision Engineering Meets Creative Spark**: Crisp structural micro-borders, clean geometry, and high-legibility typographic hierarchy that balance artistic freedom with rigorous agency management and delivery trust.

## Colors
The palette is built around deep midnight surfaces punctuated by energetic neon focal points:

- **Canvas & Backgrounds**: Base canvas sits at `#05070D` with secondary elevated surfaces at `#080B14` and glass cards at `#0E1322` / `rgba(14, 19, 34, 0.7)`.
- **Primary Energy (Solar Orange)**: `#FF5E1E` (accenting to `#FF7A00`) represents creative kineticism, call-to-action urgency, and student vitality.
- **Secondary Identity (Electric Violet)**: `#7A22FF` (scaling to `#9D4EDD`) brings deep artistic prestige, technology-driven innovation, and media mastery.
- **Signature Gradient**: Linear transitions from `#FF5E1E` through `#D8328E` to `#7A22FF` applied to hero buttons, active indicators, and brand crests.
- **Structural Borders**: Subtle, high-tech definition using `rgba(255, 255, 255, 0.08)`, `#1E2640`, and `#2D3748`.
- **Text & Content**: Primary text sits at pure high-clarity `#F8FAFC`, secondary descriptive text at `#94A3B8`, and muted captions at `#64748B`.

## Typography
Typographic rhythm combines geometric personality with utilitarian readability:
- **Headlines (Plus Jakarta Sans)**: Contemporary, rounded geometry with bold impact for promotional claims, punchy hero hooks, and section titles.
- **Body & Controls (Inter)**: Exceptional tabular clarity, optical consistency across dense dashboards, creator cards, filter chips, and metadata.
- **Gradient Accents**: Emphasized words within display headlines often take the signature `#FF5E1E` to `#FF7A00` or `#7A22FF` linear gradient fill using background clip techniques.

## Layout & Spacing
The layout system enforces structured grid discipline while allowing rich visual showcases:
- **Desktop (>= 1200px)**: 12-column grid system with 24px gutters and maximum container bounds of 1280px or 1440px for immersive dashboards.
- **Tablet (768px - 1199px)**: 8-column grid with 20px gutters and 32px screen margins; multi-card grids reflow from 4-columns down to 2-columns.
- **Mobile (< 768px)**: 4-column fluid structure with 16px gutters and 16px outer boundary margins. Floating action bars and horizontal swipe carousels replace rigid grids for media items.
- **Vertical Spacing Rhythm**: Structural sections leverage `3.5rem` to `5rem` top and bottom margins to provide breathable contrast against rich saturated video and image thumbnails.

## Elevation & Depth
Depth is created through luminescence and frosted layering rather than muddy dark drop shadows:

1. **Surface 0 (Canvas Ground)**: Solid deep obsidian (`#05070D`).
2. **Surface 1 (Base Container / Grid Cards)**: Semi-translucent dark slate (`#0E1322` at 80% opacity) coupled with `backdrop-filter: blur(16px)` and a 1px border of `rgba(255, 255, 255, 0.08)`.
3. **Surface 2 (Elevated Popovers & Modals)**: `#161B2E` with 1px border `#2D3748` and an ambient diffuse glow: `0 12px 36px -4px rgba(0, 0, 0, 0.6)`.
4. **Neon Bloom**: Primary call-to-action components carry an active chromatic back-glow: `0 8px 24px -4px rgba(255, 94, 30, 0.35)`. Violet interactive elements utilize `0 8px 24px -4px rgba(122, 34, 255, 0.35)`.

## Shapes
A balanced curvature framework bridges sleek tech hardware with fluid creative warmth:
- Standard Interactive Elements (inputs, buttons, pill badges): 8px to 12px border radius.
- Cards, Dialogs, and Showcase Modules: 14px to 18px border radius (`rounded-lg` to `rounded-xl`).
- Micro Badges, Avatars, and Quick-Toggles: Fully rounded pill formats (`rounded-full`).

## Components

### Buttons
- **Primary Action**: Dynamic linear gradient fill (`#FF5E1E` to `#FF7A00`), white bold text, subtle inner highlight `inset 0 1px 0 rgba(255,255,255,0.25)`, 12px radius, and an orange glow shadow on hover.
- **Secondary Creative**: Dark glass background (`rgba(255,255,255,0.05)`), crisp 1px border (`#2D3748`), white text; on hover transitions border color to `#7A22FF` with a soft purple aura.
- **Tertiary / Ghost**: Transparent background with muted slate text (`#94A3B8`) shifting to `#FFFFFF` on hover with a slight background wash (`rgba(255,255,255,0.04)`).

### Input Fields & Filter Bars
- **Container Bar**: High-density horizontal modular dock (e.g., search term, category dropdown, location, level) with dark glass surface (`#0A0D18`), divided by subtle 1px vertical borders (`#1E2640`).
- **Inputs**: Transparent background, placeholder color `#64748B`, active text `#F8FAFC`. Focus states replace the subtle border with a crisp dual-glow accent (`#FF5E1E` or `#7A22FF`).

### Showcase Cards (Projects & Creators)
- **Structure**: Rounded 16px enclosures with overflow hidden. Media thumbnails occupy the top tier with a subtle vignette overlay.
- **Content Block**: Lower section housed in dark navy charcoal (`#0C101D`) with project title, creator team avatar chips, rating stars in neon amber (`#FFB800`), and quick-action view badges.
- **Hover State**: Subtle 2px upward translation with border illumination moving from neutral slate to gradient orange-violet edge.

### Chips & Badges
- **Category Tags**: Pill format, 6px vertical padding, 12px horizontal padding. Saturated micro-dots or glowing badge tints (e.g., Video: `#FF5E1E` background at 15% opacity with `#FF7A00` text; Photography: `#7A22FF` at 15% with `#9D4EDD` text).

### Process Steppers & Metrics
- Linear glowing connection lines between steps with sequenced numbers housed in rounded glass squares; active steps highlighted with neon halo rings.