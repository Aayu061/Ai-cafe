# AI CAFÉ — Brand Identity & Design System
**Phase 7.4 Standard | "Your Drink. Your Way."**

---

## 1. Brand Essence

**AI CAFÉ** combines the authentic warmth of an artisan specialty coffee house with the precision of intuitive AI personalization.

- **Brand Name**: AI CAFÉ
- **Primary Tagline**: “Your Drink. Your Way.”
- **Supporting Descriptor**: “Crafted by AI. Inspired by You.”
- **Brand Personality**: Warm, Natural, Sophisticated, Intelligent, Crafted, Editorial, Minimalist.

---

## 2. Logo System

The official AI CAFÉ logo mark unites an elegant cold-brew glassware silhouette with a delicate 4-pointed intelligence spark at the glass rim.

### Logo Mark Anatomy:
1. **Outer Contour**: Sleek, handcrafted glassware with a gentle inward curve and weighted stable base.
2. **Internal Fluidity**: Stratified cold-brew liquid horizon representing slow-steeped artisan coffee.
3. **Intelligence Spark**: A restrained 4-pointed geometric star symbolizing subtle AI intelligence without technological clichés.

### Variants (`<Logo variant="..." />`):
- `default`: Mark + Playfair Display "AI CAFÉ" wordmark + "Your Drink. Your Way." tagline.
- `compact`: Mark + "AI CAFÉ" wordmark (ideal for headers and small cards).
- `horizontal`: Mark + Wordmark + Category descriptor separated by divider.
- `symbol`: Standalone mark (used on mobile nav, favicon, and app icons).
- `monochrome`: Single-tone for stamps, packaging, and high-contrast surfaces.

### Themes:
- `espresso`: Dark coffee tone `#3A2418` text and mark for light cream backgrounds.
- `cream`: Warm cream `#FFFDF8` text with `#C98A4A` caramel accents for dark backgrounds.

---

## 3. Color Palette

| Token | Hex | Role | Usage |
|---|---|---|---|
| **Warm Cream** | `#F7F1E7` | Primary Background | Clean, editorial canvas feeling like warm paper or cream. |
| **Off White** | `#FFFDF8` | Card Background | Surface elements, cards, elevated containers. |
| **Espresso** | `#3A2418` | Primary Typography | Deep roasted tone for all authoritative headings and text. |
| **Caramel** | `#C98A4A` | Primary Accent | Artisan buttons, sparks, badges, active states. |
| **Natural Brown** | `#795548` | Secondary Accent | Subtitles, supporting notes, borders. |
| **Deep Sage** | `#263A2E` | Botanical Accent | Tea tags, health indicators, subtle success states. |
| **Soft Sage** | `#A8B9A3` | Atmospheric Glow | Background radial blurs, seasonal highlights. |
| **Warm Gray** | `#8C877F` | Muted Text | Microcopy, timestamps, metadata, borders. |

---

## 4. Typography Hierarchy

### Primary Serif: Playfair Display
- Used for: Brand Wordmark, Hero Headings, Section Titles, Emotional Moments.
- Weights: Bold (700), SemiBold (600), Italic.

### Primary Sans: Inter
- Used for: Body Copy, Buttons, Navigation, Metadata, Numerical Readouts.
- Weights: Regular (400), Medium (500), SemiBold (600), Bold (700).

---

## 5. Favicon & Digital Icons

- **Favicon / App Icon**: `src/app/icon.tsx` dynamically renders the 32x32 SVG cold-brew silhouette on an Espresso `#3A2418` rounded backdrop.
- **Web Manifest**: `src/app/manifest.ts` specifies theme color `#3A2418` and background color `#F7F1E7`.
- **Open Graph Card**: `src/app/opengraph-image.tsx` generates a 1200x630 social share card featuring the brand mark, caramel badge, and editorial tagline.

---

## 6. Brand Opening Experience (Loading System)

The loading experience represents **"walking into a premium café early in the morning"**:
1. **Background**: Warm cream `#F7F1E7` with subtle radial grain pattern.
2. **Hierarchy**: Centered logo mark, brand name, tagline, progress indicator, contextual status text.
3. **Real Boot Integration**: Reflects genuine font readiness, frame 1 decode, catalog preload, AI health check, and auth resolution.
4. **Fast Load Philosophy**: If assets are already cached, transitions out immediately without artificial delays.
5. **Graceful Fallbacks**: If AI is offline, provides informative degraded notice and [Enter Café] button so the customer is never trapped.
6. **Reduced Motion**: Respects `prefers-reduced-motion` with instant opacity fade instead of scale transitions.

---

## 7. Brand Rules & Usage Guidelines

### ✅ Correct Usage:
- Render the logo on warm cream, off-white, espresso, or dark café tones.
- Maintain generous negative space around the logo mark (minimum 1.5x mark width).
- Preserve the Playfair Display + Inter typographic hierarchy.
- Use natural coffee tones, warm caramel accents, and botanical sage touches.

### ❌ Incorrect Usage:
- NEVER introduce neon colors, cyan/purple AI gradients, or cyberpunk elements.
- NEVER replace the logo mark with robot heads, circuit boards, or cartoon coffee cups.
- NEVER distort or alter the aspect ratio of the logo mark.
- NEVER add harsh drop shadows or 3D chrome effects.
- NEVER invent claims or fake functionality.
