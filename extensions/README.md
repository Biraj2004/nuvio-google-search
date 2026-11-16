# Pre-Built Extension Packages

This directory contains production-ready, release-packaged distributions of the Nuvio for Google Search extension for all supported browser platforms.

## Packages

| Archive | Target Browsers | Manifest Format | Internal Folder |
| :--- | :--- | :--- | :--- |
| `nuvio-google-search-chromium-v1.0.0.zip` | Chrome, Brave, Opera, Microsoft Edge, Vivaldi | Manifest V3 (Service Worker) | `nuvio-google-search-chromium-v1.0.0/` |
| `nuvio-google-search-firefox-v1.0.0.zip` | Mozilla Firefox (Desktop & Mobile) | Manifest V3 (Gecko MV3) | `nuvio-google-search-firefox-v1.0.0/` |

## Subfolder Structure

Each archive is packaged with a top-level release directory to ensure clean extraction:
```
nuvio-google-search-chromium-v1.0.0.zip
└── nuvio-google-search-chromium-v1.0.0/
    ├── manifest.json
    ├── background/
    │   └── service-worker.js
    ├── content/
    │   ├── google.js
    │   ├── google.css
    │   └── nuvio-web.js
    ├── icons/
    │   ├── icon-16.png
    │   ├── icon-32.png
    │   ├── icon-48.png
    │   ├── icon-128.png
    │   ├── icon-256.png
    │   └── icon.svg
    ├── options/
    │   ├── options.html
    │   ├── options.css
    │   └── options.js
    ├── popup/
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js
    └── utils/
        ├── browser-polyfill.js
        ├── protocol-launcher.js
        └── storage.js
```

## How to Install

### Chromium Browsers (Google Chrome, Brave, Opera, Edge, Vivaldi)
1. Download and extract `nuvio-google-search-chromium-v1.0.0.zip`.
2. Open your browser extensions manager:
   - Chrome: `chrome://extensions/`
   - Brave: `brave://extensions/`
   - Edge: `edge://extensions/`
   - Opera: `opera://extensions/`
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the extracted `nuvio-google-search-chromium-v1.0.0` folder.

### Mozilla Firefox
1. Download and extract `nuvio-google-search-firefox-v1.0.0.zip`.
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**
4. Select `manifest.json` located inside the extracted `nuvio-google-search-firefox-v1.0.0` folder.

## Build Automation

The packages in this directory are generated and updated automatically by the build script:
```bash
python scripts/build.py
```
Whenever source code in `src/` is modified, executing the build script regenerates the unpacked distributions in `dist/` and compiles fresh versioned archives into this `extensions/` directory.
