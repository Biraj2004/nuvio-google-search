# Architecture Documentation

## Overview

The Nuvio for Google Search extension integrates Nuvio streaming access into Google Search Knowledge Panels for movies and television series. It provides a dual-channel dispatch pipeline: prioritizing the local Nuvio Desktop application via a custom protocol scheme (`nuvio://`), with an automated, non-intrusive fallback to the Nuvio Web client (`https://nuvio-web.vercel.app/`).

## System Architecture

```
+--------------------------------------------------------------------------------+
|                                 Google Search SERP                             |
|                                                                                |
|   +------------------------------------------------------------------------+   |
|   |                       Google Knowledge Panel                           |   |
|   |   +-------------------+  +--------------------+  +-----------------+   |   |
|   |   | Movie / TV Title  |  | "Where to Watch"   |  | Quick Action    |   |   |
|   |   | & Subtitle Info   |  | Container          |  | Buttons Row     |   |   |
|   |   +-------------------+  +--------------------+  +-----------------+   |   |
|   |                                    |                      |            |   |
|   +------------------------------------|----------------------|------------+   |
|                                        v                      v                |
|                           [Injected Provider Card]  [Injected Action Pill]     |
|                                        \                      /                |
+-----------------------------------------\--------------------/-----------------+
                                           \                  /
                                            v                v
                                      +----------------------------+
                                      |     Content Controller     |
                                      |    (content/google.js)     |
                                      +----------------------------+
                                                    |
                                                    v
                                      +----------------------------+
                                      |      Protocol Launcher     |
                                      | (utils/protocol-launcher.js|
                                      +----------------------------+
                                                    |
                     +------------------------------+-----------------------------+
                     | (Mode = 'ask')                                             | (Mode = 'smart' / 'desktop')
                     v                                                            v
       +----------------------------+                               +----------------------------+
       |   Native Permission Modal  |                               |    Protocol Scheme Call    |
       |      (utils/modal.js)      |                               |         nuvio://           |
       +----------------------------+                               +----------------------------+
         /                        \                                               |
  [Open in App]              [Open in Web]                          +-------------+-------------+
        |                          |                                |                           |
        v                          v                          (App Detected)             (Timeout Reached)
  +-------------+            +-------------+                        |                           |
  |  nuvio://   |            |  Nuvio Web  |                        v                           v
  +-------------+            +-------------+                  Launch Handled             Fallback Web Tab
        |                          |                                               https://nuvio-web.vercel.app
   (Timeout Fail)                  |                                                            |
        |                          |                                                            v
        +--------------------------+                                              +----------------------------+
                                                                                  |  Web Companion Controller  |
                                                                                  |   (content/nuvio-web.js)   |
                                                                                  +----------------------------+
                                                                                  Auto-fills & executes search
```

## Component Breakdown

### 1. Google Search Content Script (`src/content/google.js`)
- **Metadata Extraction**: Scrapes the current page for entity identifiers including IMDb ID (`tt\d+`), entity title, media type (`movie` vs `series`), and release year.
- **DOM Injection Engine**: Identifies appropriate insertion anchors in the Google Knowledge Graph:
  - Streaming Providers Container (`div[data-attrid*="media_actions"]`).
  - Action Header Row (next to Watchlist and Share controls).
  - Floating Action Pill (FAB) as a fallback when no provider container is rendered by Google.
- **Mutation Observer**: Monitors `#rcnt` and `document.body` for dynamic single-page transitions in Google Search to reinject elements without duplicating or leaking memory.

### 2. Protocol Launcher & Fallback Detector (`src/utils/protocol-launcher.js`)
- Formats destination URLs:
  - Desktop URI: `nuvio:///detail/{contentType}/{imdbId}` or `nuvio://search?q={query}`.
  - Web URL: `https://nuvio-web.vercel.app/search?q={query}`.
- Handles protocol invocation via isolated hidden iframe or programmatic anchor click.
- Protocol Detection Engine:
  - Registers temporary `blur` and `visibilitychange` listeners.
  - If the native application launches or a native OS confirmation dialog appears, the window loses focus or becomes hidden.
  - If the timer expires (default: 1500ms) without focus loss, the application is deemed unavailable, and the browser opens the Nuvio Web client in a new tab.

### 3. Permission Modal Dialog (`src/utils/modal.js`)
- Emulates native browser permission prompts ("Open in Nuvio Desktop App?").
- Includes an "Always allow google.com to open links in Nuvio Desktop" checkbox.
- Offers distinct actions: Open Nuvio App, Open in Web, and Cancel.
- Locks background scrolling while open, and cleanly restores scrolling upon closure.
- If cancelled, remembers user preference to prompt each time without intrusive notifications.

### 4. Companion Content Script (`src/content/nuvio-web.js`)
- Activates on `https://nuvio-web.vercel.app/*`.
- Parses incoming search parameters (`?q=...`).
- Populates `sessionStorage.lastSearchQuery` and triggers the search input element via synthetic React-compatible event dispatchers, ensuring seamless query execution.

### 5. Storage & Preference Layer (`src/utils/storage.js`)
- Wraps `chrome.storage.sync` with automatic fallback to `chrome.storage.local`.
- Persists user preferences:
  - `launchMode`: `ask` (default), `smart`, `web`, `desktop`.
  - `protocolScheme`: `nuvio://`.
  - `webBaseUrl`: `https://nuvio-web.vercel.app/`.
  - `timeoutMs`: `1500`.
  - `enableFabFallback`: `true`.
  - `rememberChoice`: `false`.

### 6. Background Service Worker (`src/background/service-worker.js`)
- Manifest V3 background coordinator.
- Manages installation defaults.
- Handles cross-origin tab opening requests via runtime message passing.

### 7. User Interface Panels
- **Popup (`src/popup/`)**: Quick toggle for launch modes, reset decisions button, direct links to Nuvio resources.
- **Options (`src/options/`)**: Advanced settings including protocol scheme override, custom web client endpoints, and detection timeouts.
