# Design Specifications

## Philosophy

The Nuvio for Google Search interface adheres to strict design standards:
- **No Emojis**: Visual clarity is achieved using crisp typography, official brand iconography, and structured layouts. No emojis are permitted anywhere in the UI or codebase.
- **Unslop Aesthetics**: Zero visual clutter, no bloated marketing buzzwords, and no generic artificial aesthetics.
- **Native Alignment**: Injected components match Google Search Knowledge Panel typography, borders, and colors in both light and dark modes.
- **Authentic Branding in Search**: Injected Google Search results feature the official Nuvio streaming provider icon (`nuvio-provider-*.png`) to provide immediate, trusted recognition alongside other streaming platforms.
- **Copyright-Safe Extension Identity**: The browser extension package (`chrome://extensions/`, toolbar popup, and extension stores) utilizes a modified, bespoke mark (`icon-*.png` and `logo.png`). It reimagines the Nuvio stream concept by integrating a sleek search lens / discovery motif in Nuvio's brand colors (deep navy `#0d101e`, cyan `#40d0e8`, and violet `#b64df5`), ensuring 100% original, copyright-compliant open-source distribution.

## Color Tokens

| Token | Light Theme | Dark Theme | Purpose |
| :--- | :--- | :--- | :--- |
| `--nuvio-brand-bg` | `#0d101e` | `#0d101e` | Official Nuvio deep navy surface |
| `--nuvio-brand-accent` | `#7c3aed` | `#a855f7` | Official Nuvio brand purple / violet |
| `--nuvio-brand-cyan` | `#06b6d4` | `#40d0e8` | Official Nuvio cyan gradient highlight |
| `--nuvio-bg-surface` | `#ffffff` | `#121626` | Primary card background |
| `--nuvio-bg-surface-elevated` | `#f8f9fa` | `#1a1f33` | Sub-cards, dialog footers |
| `--nuvio-bg-hover` | `#f3e8ff` | `#242a45` | Hover states |
| `--nuvio-text-primary` | `#1f2937` | `#f3f4f6` | Titles and primary text |
| `--nuvio-text-secondary` | `#4b5563` | `#9ca3af` | Subtitles and meta details |
| `--nuvio-text-muted` | `#6b7280` | `#6b7280` | Timestamps and secondary labels |
| `--nuvio-border` | `#e5e7eb` | `#262c45` | Section and card borders |
| `--nuvio-primary` | `#7c3aed` | `#a855f7` | Primary buttons and focus rings |
| `--nuvio-accent-tag-bg` | `#f3e8ff` | `#2d1f42` | Badges and chip highlights |
| `--nuvio-accent-tag-text` | `#7c3aed` | `#c084fc` | Badge text |

## Component Specifications

### 1. Watch Provider Card
- **Location**: Injected directly into the Google Search "Where to Watch" provider stack (`div[data-attrid*="media_actions"]`).
- **Dimensions**: Full container width, 48px height, 8px padding, 8px border radius.
- **Icon**: 32x32px authentic Nuvio streaming provider brand tile (`nuvio-provider-32.png`) on `#0d101e` with 7px corner radius.
- **Text Hierarchy**:
  - Title: 14px Semi-Bold (600 weight), `#1f2937` (light) / `#f3f4f6` (dark).
  - Badge: "Free", 11px Semi-Bold, contained in rounded violet pill.
  - Subtitle: "Desktop App · Web Client", 12px Regular, `#4b5563` (light) / `#9ca3af` (dark).
- **CTA**: "Watch" button on the right edge, styled to match Google streaming service action chips with Nuvio's signature violet primary color.

### 2. Header Action Button
- **Location**: Horizontal quick action button bar beneath movie title, adjacent to "Watchlist" and "Share".
- **Dimensions**: Auto width, 32px height, 20px pill border radius.
- **Icon**: 18x18px Nuvio logo tile.
- **Label**: "Watch on Nuvio", 13px Medium.

### 3. Permission Modal Dialog
- **Backdrop**: Full viewport overlay with `rgba(13, 16, 30, 0.7)` and `backdrop-filter: blur(5px)`.
- **Background Scroll Lock**: Automatically sets `overflow: hidden !important` and `overscroll-behavior: contain !important` on `<html>` and `<body>` via `.nuvio-modal-open` while the dialog is active, cleanly restoring original page scrolling when closed.
- **Dialog Box**: 460px maximum width, 12px border radius, subtle violet drop shadow.
- **Header**:
  - 38x38px Nuvio logo.
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
  - `Open Nuvio App`: Primary violet action button, auto-focused.

### 4. Floating Action Pill (FAB) Fallback
- **Location**: Fixed bottom-right of viewport (`bottom: 24px`, `right: 24px`), z-index `9999`.
- **Styling**: `#0d101e` solid background with 1px `rgba(182, 77, 245, 0.35)` border.
- **Behavior**: Auto-hides on scroll-down, restores on scroll-up. Click triggers watch action.
