# AGENTS.md

## Repository Overview

`nuvio-google-search` is an open-source browser extension that integrates Nuvio streaming options directly into Google Search results for movies and television series. It launches titles in the Nuvio Desktop application (`nuvio://`) first, detecting whether the native app is available and automatically falling back to the Nuvio Web client (`https://nuvio-web.vercel.app/`).

## Project Principles

1. **No Emojis**: Do not use emojis in UI elements, user-facing text, markdown documentation, code comments, or commit messages. Maintain clean, professional typography.
2. **Unslop**: Write clean, concise, production-grade code. Avoid bloated marketing buzzwords, boilerplate wrappers, and artificial fluff.
3. **Zero External Runtime Dependencies**: All runtime extension code must remain vanilla modern JavaScript (ES6+), standard WebExtension APIs, and pure CSS. Do not introduce npm bundle dependencies into `src/`.
4. **Cross-Browser Compatibility**: Support Chrome, Brave, Opera, Microsoft Edge, Vivaldi, and Mozilla Firefox seamlessly via unified Manifest V3 design.
5. **Robust Error Boundaries**: Never break or interfere with Google Search's native functionality. Isolate all injected styles and scripts.

## Directory Structure

```
nuvio-google-search/
├── .github/
│   └── workflows/
│       └── build.yml               # Automated CI build workflow
├── .gitignore                      # Git ignore patterns
├── AGENTS.md                       # Agent & developer instructions (this file)
├── LICENSE                         # MIT License
├── README.md                       # Root open-source documentation
├── extensions/                     # Pre-packaged release archives
│   ├── README.md                   # Archive manifest and instructions
│   ├── nuvio-google-search-chromium-v1.0.0.zip
│   └── nuvio-google-search-firefox-v1.0.0.zip
├── guide/                          # Comprehensive technical guides
│   ├── architecture.md             # System design and component data flow
│   ├── configuration.md            # Storage schema and option keys
│   ├── cross-browser-compatibility.md # Browser engine nuances and polyfills
│   ├── decisions.md                # Architecture Decision Records (ADRs)
│   ├── design.md                   # Visual design tokens and UI specs
│   ├── google-search-dom.md        # Google Knowledge Panel DOM selectors
│   └── installation.md             # Sideloading and developer installation
├── src/                            # Extension source files (Manifest V3)
│   ├── manifest.json               # Root extension manifest
│   ├── background/
│   │   └── service-worker.js       # Background service worker
│   ├── content/
│   │   ├── google.js               # Google SERP content script
│   │   ├── google.css              # Styles for injected cards and modal
│   │   └── nuvio-web.js            # Companion script for Nuvio Web client
│   ├── icons/
│   │   ├── icon-16.png             # 16x16 icon
│   │   ├── icon-32.png             # 32x32 icon
│   │   ├── icon-48.png             # 48x48 icon
│   │   ├── icon-128.png            # 128x128 icon
│   │   ├── icon-256.png            # 256x256 icon
│   │   └── icon.svg                # Vector SVG icon
│   ├── options/
│   │   ├── options.html            # Extension options page
│   │   ├── options.css             # Options styling
│   │   └── options.js              # Options controller
│   ├── popup/
│   │   ├── popup.html              # Extension toolbar popup
│   │   ├── popup.css               # Popup styling
│   │   └── popup.js                # Popup controller
│   └── utils/
│       ├── browser-polyfill.js     # Unified chrome.* and browser.* wrapper
│       ├── modal.js                # Native-style in-page permission modal
│       ├── protocol-launcher.js    # Protocol handler with fallback timer
│       └── storage.js              # chrome.storage synchronization layer
├── scripts/
│   └── build.py                    # Build script generating dist/ and release zips
└── dist/                           # Generated builds (git ignored)
    ├── chromium/                   # Chrome, Brave, Edge, Opera unpacked dist
    ├── firefox/                    # Firefox Gecko MV3 unpacked dist
    └── releases/                   # Zip packages for distribution
```

## Protocol Launcher & Detection Mechanics

When a user clicks "Watch on Nuvio":
1. **Metadata Resolution**: Scrapes title, release year, media type (`movie` vs `series`), and IMDb ID (`tt\d+`).
2. **Mode Check**:
   - `ask`: Displays the in-page permission dialog (with background scrolling locked). If user confirms with "Always allow", updates storage to `smart`. If cancelled, closes the dialog cleanly and remains in `ask` mode.
   - `smart`: Triggers `nuvio://` via hidden iframe or anchor, and starts a 1500ms timer. If window loses focus (`blur`) or page hides, app launch succeeded. If timer elapses without blur, auto-opens `https://nuvio-web.vercel.app/`.
   - `web`: Directly opens web URL in a new tab.
   - `desktop`: Directly triggers `nuvio://` protocol.

## Google Search DOM Strategy

- Never rely on single obfuscated class names (e.g. `.wDYxhc`). Use `data-attrid` attributes:
  - `div[data-attrid*="media_actions"]`
  - `div[data-attrid^="kc:/film/film:"]`
  - `div[data-attrid^="kc:/tv/tv_program:"]`
- Tag all injected DOM nodes with `.nuvio-injected` and static IDs (`#nuvio-watch-provider-card`, `#nuvio-header-action-btn`, `#nuvio-floating-action-pill`) to guarantee idempotent injection without duplication.
- Observe `#rcnt` with a debounced `MutationObserver` (150ms) to support dynamic single-page searches.

## Build and Validation Commands

To build and package the extension:
```bash
python scripts/build.py
```

The script:
1. Validates that every file declared in `manifest.json` exists on disk.
2. Generates `dist/chromium/` and `dist/firefox/`.
3. Compiles production release zip archives in `extensions/` (and mirrors them in `dist/releases/`), ensuring all files are stored inside a versioned top-level subfolder for clean extraction.

## Conventional Commit Standards

All commits must follow the Conventional Commits specification:
- `feat: <description>` for new features
- `fix: <description>` for bug fixes
- `docs: <description>` for documentation changes
- `refactor: <description>` for code restructuring
- `style: <description>` for visual adjustments
- `chore: <description>` for maintenance or build changes
