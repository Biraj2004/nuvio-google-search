# Design Specifications

## Philosophy

The Nuvio for Google Search interface adheres to strict design standards:
- **No Emojis**: Visual clarity is achieved using crisp typography, official brand iconography, and structured layouts. No emojis are permitted anywhere in the UI or codebase.
- **Unslop Aesthetics**: Zero visual clutter, no bloated marketing buzzwords, and no generic artificial aesthetics.
- **Native Alignment**: Injected components match Google Search Knowledge Panel typography, borders, and colors in both light and dark modes.
- **Authentic Branding**: Real Nuvio geometry (circular badge with centered triangular delta glyph) rendered via high-DPI vector SVG and anti-aliased PNG assets.

## Color Tokens

| Token | Light Theme | Dark Theme | Purpose |
| :--- | :--- | :--- | :--- |
| `--nuvio-bg-surface` | `#ffffff` | `#202124` | Primary card background |
| `--nuvio-bg-surface-elevated` | `#f8f9fa` | `#303134` | Sub-cards, dialog footers |
| `--nuvio-bg-hover` | `#f1f3f4` | `#3c4043` | Hover states |
| `--nuvio-text-primary` | `#202124` | `#e8eaed` | Titles and primary text |
| `--nuvio-text-secondary` | `#5f6368` | `#9aa0a6` | Subtitles and meta details |
| `--nuvio-text-muted` | `#70757a` | `#80868b` | Timestamps and secondary labels |
| `--nuvio-border` | `#dadce0` | `#3c4043` | Section and card borders |
| `--nuvio-primary` | `#1a73e8` | `#8ab4f8` | Primary buttons and focus rings |
| `--nuvio-accent-tag-bg` | `#e8f0fe` | `#2d3748` | Badges and chip highlights |
| `--nuvio-accent-tag-text` | `#1967d2` | `#8ab4f8` | Badge text |

## Component Specifications

### 1. Watch Provider Card
- **Location**: Injected directly into the Google Search "Where to Watch" provider stack (`div[data-attrid*="media_actions"]`).
- **Dimensions**: Full container width, 48px height, 8px padding, 8px border radius.
- **Icon**: 32x32px Nuvio brand icon with 6px corner radius.
- **Text Hierarchy**:
  - Title: 14px Medium (500 weight), `#202124` (light) / `#e8eaed` (dark).
  - Badge: "Free", 11px Medium, contained in rounded pill.
  - Subtitle: "Desktop App · Web Client", 12px Regular, `#5f6368` (light) / `#9aa0a6` (dark).
- **CTA**: "Watch" button on the right edge, styled to match Google streaming service action chips.

### 2. Header Action Button
- **Location**: Horizontal quick action button bar beneath movie title, adjacent to "Watchlist" and "Share".
- **Dimensions**: Auto width, 32px height, 20px pill border radius.
- **Icon**: 18x18px Nuvio logo.
- **Label**: "Watch on Nuvio", 13px Medium.

### 3. Permission Modal Dialog
- **Backdrop**: Full viewport overlay with `rgba(0, 0, 0, 0.7)` and `backdrop-filter: blur(4px)`.
- **Dialog Box**: 460px maximum width, 12px border radius, subtle drop shadow.
- **Header**:
  - 36x36px Nuvio logo.
  - Title: "Open in Nuvio Desktop App?", 16px Semi-Bold.
  - Subtitle: "https://www.google.com wants to open this application.", 12px Regular.
  - Close button with `&times;` glyph.
- **Media Information Card**:
  - Displays content type tag (e.g. "MOVIE · 2024 · tt0000000").
  - Title in bold 15px text with ellipsis overflow protection.
- **Checkbox Row**:
  - Checkbox: "Always allow google.com to open links in Nuvio Desktop".
- **Action Buttons**:
  - `Cancel`: Secondary button, neutral background.
  - `Open in Web`: Secondary button, neutral background.
  - `Open Nuvio App`: Primary blue action button, auto-focused.

### 4. Floating Action Pill (FAB) Fallback
- **Location**: Fixed bottom-right of viewport (`bottom: 24px`, `right: 24px`), z-index `9999`.
- **Styling**: `#111111` solid background with 1px `rgba(255, 255, 255, 0.15)` border.
- **Behavior**: Auto-hides on scroll-down, restores on scroll-up. Click triggers watch action.

### 5. Toast Notifications
- **Location**: Bottom center of viewport (`bottom: 24px`), horizontal slide-up animation.
- **Color**: Dark elevated surface (`#1f2023`), white text, action button in accent blue.
- **Auto-dismiss**: 3 to 5 seconds depending on whether an action button is present.
