# Installation and Developer Sideloading Guide

## Pre-Built Release Archives

If you prefer not to build from source, pre-compiled release packages are provided directly in the [`extensions/`](../extensions/) directory:
- `nuvio-google-search-chromium-v1.0.0.zip` (for Chrome, Brave, Edge, Opera, Vivaldi)
- `nuvio-google-search-firefox-v1.0.0.zip` (for Mozilla Firefox)

Each archive contains an internal release directory (e.g. `nuvio-google-search-chromium-v1.0.0/`) with all extension files ready to extract and load.

---

## Quick Start from Source

### Prerequisites
- Python 3.8+ (for building release packages).
- Any modern web browser (Chrome, Brave, Opera, Edge, Firefox).

### 1. Build the Distribution
Run the build script to validate assets and generate browser-specific distributions:

```bash
python scripts/build.py
```

This creates:
- `dist/chromium/`: Ready for Chrome, Brave, Opera, and Microsoft Edge.
- `dist/firefox/`: Ready for Mozilla Firefox.
- `dist/releases/*.zip`: Standalone zip archives for packaging and distribution.

---

## Browser-Specific Instructions

### Google Chrome & Chromium-based Browsers

1. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked** in the top-left toolbar.
4. Select the `dist/chromium` folder (or directly the `src` folder).
5. The extension "Nuvio for Google Search" will now appear in your extensions list.

---

### Brave Browser

1. Navigate to:
   ```
   brave://extensions/
   ```
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `dist/chromium` folder.
5. In Brave Shields settings, ensure custom protocols are allowed when prompted.

---

### Microsoft Edge

1. Navigate to:
   ```
   edge://extensions/
   ```
2. Toggle on **Developer mode** in the left sidebar.
3. Click **Load unpacked**.
4. Select the `dist/chromium` folder.

---

### Opera & Opera GX

1. Open Opera and navigate to:
   ```
   opera://extensions/
   ```
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `dist/chromium` folder.

---

### Mozilla Firefox

1. Open Firefox and navigate to:
   ```
   about:debugging#/runtime/this-firefox
   ```
2. Click **Load Temporary Add-on...**
3. Navigate to the `dist/firefox` directory and select `manifest.json`.
4. The extension will load and remain active for your browsing session.
   *(For permanent installation in Firefox Developer Edition or Nightly, the extension can be signed or loaded via `xpinstall.signatures.required: false`).*

---

## Verifying the Installation

1. Open Google Search with a movie or series query (for example, "Example Movie" or "Sample Series").
2. Look at the Knowledge Panel on the right or the "Where to watch" section.
3. You will see **Nuvio** listed as a streaming provider with a direct "Watch" button.
4. Click "Watch":
   - The native-style permission dialog will appear.
   - Choose **Open Nuvio App** to test protocol launch or **Open in Web** to open `nuvio-web.vercel.app`.
