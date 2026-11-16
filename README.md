<div align="center">

<img src="assets/logo.svg" width="96" height="96" alt="Nuvio Logo" />

# Nuvio for Google Search

**Adds Nuvio directly to the "Where to Watch" movie and series panel in Google Search.**

Directly opens titles in the Nuvio Web streaming client with zero desktop app requirements and zero popups.

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-111111?style=flat-square&logo=googlechrome&logoColor=white)](src/manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-111111?style=flat-square)](LICENSE)
[![Cross-Browser](https://img.shields.io/badge/Compatibility-Chrome%20|%20Brave%20|%20Edge%20|%20Opera%20|%20Firefox-111111?style=flat-square)](guide/cross-browser-compatibility.md)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-111111?style=flat-square)](src/)

---

</div>

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Browser Compatibility](#browser-compatibility)
- [Quick Start & Installation](#quick-start--installation)
- [Configuration](#configuration)
- [Documentation Index](#documentation-index)
- [Project Architecture](#project-architecture)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

When searching for movies or television series on Google, Google displays a Knowledge Panel featuring a "Where to Watch" list of streaming services. **Nuvio for Google Search** seamlessly injects Nuvio into these options.

Clicking the Nuvio option initiates a direct web streaming pipeline:
1. **Direct Web Launch**: Immediately opens the title inside the [Nuvio Web client](https://nuvio-web.vercel.app/) in a new browser tab.
2. **Auto-Search Execution**: The companion script automatically populates the search query and triggers search results on Nuvio Web.
3. **Zero Friction**: No Windows desktop application schemes, no detection timeouts, and no in-page permission popups.

---

## Key Features

- **Google Knowledge Graph Integration**: Automatically attaches to the "Where to Watch" provider stack, header action buttons, or a floating action pill fallback.
- **Direct Web Navigation**: Instantly opens `https://nuvio-web.vercel.app/` with movie/series query parameters pre-populated.
- **Companion Auto-Search**: React-compatible automated input dispatch triggers search immediately upon landing on Nuvio Web.
- **No Popups or Prompts**: Clean, instant one-click streaming experience without dialogs or background scroll interference.
- **Cross-Browser Engine Support**: Manifest V3 compliant across Chromium (Chrome, Brave, Opera, Microsoft Edge, Vivaldi) and Gecko (Mozilla Firefox).
- **Zero Runtime Dependencies**: Written entirely in vanilla JavaScript (ES6+), standard WebExtension APIs, and pure CSS.
- **Dark & Light Mode Aware**: Dynamically adapts colors and contrast to match Google's active theme.
- **Strict Privacy**: Zero tracking, zero telemetry, and zero third-party analytics.

---

## How It Works

```
Google Search Query (Movie or Series)
                  │
                  ▼
   Knowledge Panel Detected
                  │
                  ▼
       [Watch on Nuvio] Button
                  │
                  ▼
       Direct Web Launch (One-Click)
                  │
                  ▼
       Open Nuvio Web in New Tab
       (https://nuvio-web.vercel.app/search?q=...)
                  │
                  ▼
       Companion Script Auto-Searches
                  │
                  ▼
       Instant Streaming Results
```

---

## Browser Compatibility

| Browser | Supported Engine | Extension Manifest | Status |
| :--- | :--- | :--- | :--- |
| **Google Chrome** | Chromium | Manifest V3 | Fully Supported |
| **Brave Browser** | Chromium | Manifest V3 | Fully Supported |
| **Microsoft Edge** | Chromium | Manifest V3 | Fully Supported |
| **Opera / Opera GX** | Chromium | Manifest V3 | Fully Supported |
| **Vivaldi** | Chromium | Manifest V3 | Fully Supported |
| **Mozilla Firefox** | Gecko | Manifest V3 | Fully Supported |

---

## Quick Start & Installation

### Option A: Install from Pre-Built Packages
Ready-to-use release archives with self-contained directory structures are located in [`extensions/`](extensions/):
- **Chromium (Chrome, Brave, Edge, Opera, Vivaldi)**: Extract [`extensions/nuvio-google-search-chromium-v1.0.0.zip`](extensions/nuvio-google-search-chromium-v1.0.0.zip), open `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select the extracted folder.
- **Mozilla Firefox**: Extract [`extensions/nuvio-google-search-firefox-v1.0.0.zip`](extensions/nuvio-google-search-firefox-v1.0.0.zip), open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on...**, and select `manifest.json`.

### Option B: Build from Source

1. Clone or download this repository:
   ```bash
   git clone https://github.com/example/nuvio-google-search.git
   cd nuvio-google-search
   ```
2. Build the distribution packages:
   ```bash
   python scripts/build.py
   ```
3. Load the generated distributions from `dist/chromium/` or `dist/firefox/`.

Detailed browser-by-browser instructions are documented in the [Installation Guide](guide/installation.md).

---

## Configuration

The extension includes a toolbar popup and a dedicated Options page:

| Setting | Default | Description |
| :--- | :--- | :--- |
| **Nuvio Web Base URL** | `https://nuvio-web.vercel.app/` | Destination URL for the web streaming client. |
| **Floating Action Pill** | `true` | Fallback button when Google omits the streaming provider list. |
| **Auto-Search Web** | `true` | Pre-populates and triggers search when opening Nuvio Web. |

Full configuration reference available in the [Configuration Guide](guide/configuration.md).

---

## Documentation Index

Comprehensive technical documentation is maintained in the [`guide/`](guide/) directory:

- [Architecture Overview](guide/architecture.md): System diagrams, component lifecycle, and data flows.
- [Architecture Decision Records (ADRs)](guide/decisions.md): Technical trade-offs and decisions.
- [Design Specifications](guide/design.md): Color tokens, typography, and UI components.
- [Google Search DOM Analysis](guide/google-search-dom.md): Reverse engineering Knowledge Panel attributes and selectors.
- [Cross-Browser Compatibility](guide/cross-browser-compatibility.md): Chromium and Firefox Manifest V3 support details.
- [Configuration Reference](guide/configuration.md): Storage keys and customization options.
- [Installation Guide](guide/installation.md): Developer sideloading and packaging guide.
- [Agent & Developer Manual](AGENTS.md): Repository guidelines, code conventions, and maintenance policies.

---

## Project Architecture

```
nuvio-google-search/
├── .github/workflows/build.yml     # Automated CI packaging and testing
├── AGENTS.md                       # Developer & AI Agent instructions
├── LICENSE                         # MIT License
├── README.md                       # Main project documentation
├── extensions/                     # Pre-packaged release archives
│   ├── README.md                   # Packaging reference
│   ├── nuvio-google-search-chromium-v1.0.0.zip
│   └── nuvio-google-search-firefox-v1.0.0.zip
├── guide/                          # Technical guides and specifications
│   ├── architecture.md
│   ├── configuration.md
│   ├── cross-browser-compatibility.md
│   ├── decisions.md
│   ├── design.md
│   ├── google-search-dom.md
│   └── installation.md
├── src/                            # Manifest V3 extension source
│   ├── manifest.json
│   ├── background/service-worker.js
│   ├── content/google.js
│   ├── content/google.css
│   ├── content/nuvio-web.js
│   ├── icons/
│   ├── options/
│   ├── popup/
│   └── utils/
│       ├── browser-polyfill.js
│       ├── protocol-launcher.js
│       └── storage.js
├── scripts/
│   └── build.py                    # Build and packaging automation
└── tests/
    └── test_runner.py              # Automated test suite (manifest, syntax, DOM, zips)
```

---

## Contributing

Contributions are welcome. Please ensure all contributions adhere to the project standards:
- Strictly no emojis in code, documentation, or commit messages.
- Maintain zero external runtime dependencies.
- Follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `chore:`).
- Run `python tests/test_runner.py` and `python scripts/build.py` prior to submitting pull requests to verify all tests and assets.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
