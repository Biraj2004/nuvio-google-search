# Cross-Browser Compatibility Guide

## Supported Browsers

The extension is architected to run across all major modern browser engines:

| Browser | Engine | Manifest Support | Status |
| :--- | :--- | :--- | :--- |
| **Google Chrome** | Chromium | Manifest V3 | Fully Supported |
| **Brave** | Chromium | Manifest V3 | Fully Supported |
| **Microsoft Edge** | Chromium | Manifest V3 | Fully Supported |
| **Opera / Opera GX** | Chromium | Manifest V3 | Fully Supported |
| **Vivaldi** | Chromium | Manifest V3 | Fully Supported |
| **Mozilla Firefox** | Gecko | Manifest V3 | Fully Supported |

## Key Platform Differences & Handling

### 1. Pure Zero-Overhead Content Script Architecture
- **Unified Across All Engines (Chromium & Firefox)**:
  Nuvio requires zero background service workers or background scripts.
  - No background memory overhead or idle wakeups.
  - Direct web launch triggered natively by user click gestures (`window.open`).
  - Direct storage access via standard WebExtension `storage.sync` APIs.
  - Firefox distribution only requires adding `browser_specific_settings.gecko.id` to `manifest.json`, which `scripts/build.py` handles automatically.

### 2. API Namespace (`chrome.*` vs `browser.*`)
To ensure zero dependency on external node modules while remaining 100% compliant:
- `src/utils/browser-polyfill.js` exposes `window.nuvioBrowser`.
- Wraps callback-based Chromium methods in native JavaScript Promises.
- Maps `nuvioBrowser.storage.sync` with automatic fallback to `nuvioBrowser.storage.local` if synchronization quotas are exceeded or disabled by browser policies.

### 3. Google Regional Domain Matching
Google operates across dozens of Country Code Top-Level Domains (ccTLDs). The content script match patterns in `manifest.json` include all major Google domains and generic wildcards:
- `*://*.google.com/search*`
- `*://*.google.co.uk/search*`
- `*://*.google.ca/search*`
- `*://*.google.com.au/search*`
- `*://*.google.de/search*`
- `*://*.google.fr/search*`
- `*://*.google.es/search*`
- `*://*.google.it/search*`
- `*://*.google.co.in/search*`
- `*://*.google.co.jp/search*`
- `*://*.google.com.br/search*`
- `*://*.google.com.*/search*`
- `*://*.google.co.*/search*`

### 4. Protocol Launch Restrictions
- **Brave Shield / Privacy Settings**: Brave may prompt the user when a protocol is triggered. Our in-page dialog cleanly precedes this step, preventing unexpected blocks.
- **Firefox Protocol Prompts**: Firefox natively isolates custom URI launches. If no application is registered, Firefox suppresses protocol errors in iframes, allowing our timeout heuristic to trigger the web fallback smoothly.
