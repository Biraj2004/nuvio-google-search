# Architecture Documentation

## Overview

The Nuvio for Google Search extension integrates Nuvio streaming access into Google Search Knowledge Panels for movies and television series. It provides a direct one-click web streaming pipeline: clicking "Watch on Nuvio" opens the title directly in the Nuvio Web client (`https://nuvio-web.vercel.app/`) with automated search query execution, requiring zero desktop applications and zero popups.

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
                                      |     Direct Web Launcher    |
                                      | (utils/protocol-launcher.js|
                                      +----------------------------+
                                                    |
                                                    v
                                      +----------------------------+
                                      |      Open New Tab          |
                                      |   Nuvio Web Search URL     |
                                      |https://nuvio-web.vercel.app|
                                      +----------------------------+
                                                    |
                                                    v
                                      +----------------------------+
                                      |  Web Companion Controller  |
                                      |   (content/nuvio-web.js)   |
                                      +----------------------------+
                                      Auto-fills & executes search
```

## Component Breakdown

### 1. Google Search Content Script (`src/content/google.js`)
- **Metadata Extraction**: Scrapes the current page for entity identifiers including IMDb ID (`tt\d+`), entity title, media type (`movie` vs `series`), and release year.
- **DOM Injection Engine**: Identifies appropriate insertion anchors in the Google Knowledge Graph:
  - Streaming Providers Container (`div[data-attrid*="media_actions_wholepage"]`) as the primary target.
  - Floating Action Pill (FAB) as a fallback when no provider container is rendered by Google.
  - Strictly avoids header action button rows (`[role="group"]`) to ensure no visual conflict with other extensions or native buttons.
- **Mutation Observer**: Monitors `#rcnt` and `document.body` for dynamic single-page transitions in Google Search to reinject elements without duplicating or leaking memory.

### 2. Direct Web Launcher (`src/utils/protocol-launcher.js`)
- Formats destination search URL: `https://nuvio-web.vercel.app/search?q={query}&imdb={imdbId}&type={contentType}`.
- Immediately calls `window.open` to launch the title directly in a new tab upon user click.
- Operates with zero desktop application checks, zero in-page prompt dialogs, and zero background thread overhead.

### 3. Companion Content Script (`src/content/nuvio-web.js`)
- Activates on `https://nuvio-web.vercel.app/*`.
- Parses incoming search parameters (`?q=...`).
- Populates `sessionStorage.lastSearchQuery` and triggers the search input element via synthetic React-compatible event dispatchers, ensuring instant query execution.

### 4. Storage & Preference Layer (`src/utils/storage.js`)
- Wraps `chrome.storage.sync` with automatic fallback to `chrome.storage.local`.
- Directly accessible from content scripts, popup, and options page without requiring a background service worker.
- Persists user preferences:
  - `webBaseUrl`: `https://nuvio-web.vercel.app/`.
  - `enableFabFallback`: `true`.
  - `autoSearchWeb`: `true`.

### 5. User Interface Panels
- **Popup (`src/popup/`)**: Displays active extension status, current target URL, direct "Open Nuvio Web" button, and settings access.
- **Options (`src/options/`)**: Custom web client endpoint override and search injection feature toggles.
