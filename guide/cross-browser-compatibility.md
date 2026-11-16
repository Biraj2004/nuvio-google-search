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

### 1. Background Execution
- **Chromium (Chrome, Brave, Edge, Opera)**:
  Uses a Background Service Worker:
  ```json
  "background": {
    "service_worker": "background/service-worker.js"
  }
  ```
- **Gecko (Mozilla Firefox)**:
  Firefox Manifest V3 requires `background.scripts` array and mandatory extension ID in `browser_specific_settings`:
  ```json
  "browser_specific_settings": {
    "gecko": {
      "id": "nuvio-google-search@nuvio.tv",
      "strict_min_version": "109.0"
    }
  },
  "background": {
    "scripts": ["background/service-worker.js"]
  }
  ```
  The build script `scripts/build.py` automatically generates both distributions.

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
