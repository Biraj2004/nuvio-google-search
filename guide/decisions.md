# Architecture Decision Records (ADRs)

This document records the architectural and design decisions made for the Nuvio for Google Search browser extension.

---

### ADR-001: Manifest V3 Architecture Across Chromium and Gecko

- **Status**: Accepted
- **Context**: Modern browsers require Manifest V3 for new extensions. Chromium browsers (Chrome, Brave, Opera, Edge) use background service workers, while Firefox supports event-driven scripts in MV3 with explicit `browser_specific_settings.gecko.id`.
- **Decision**: Develop against a unified Manifest V3 codebase. Use a build step (`scripts/build.py`) that exports target-specific manifests:
  - `dist/chromium`: Native MV3 service worker.
  - `dist/firefox`: MV3 with `browser_specific_settings` and `background.scripts`.
- **Consequences**: Single source of truth in `src/`, with automated generation of fully compliant distributions for both browser families without runtime compromises.

---

### ADR-002: Protocol Detection via Focus and Visibility Heuristics

- **Status**: Accepted
- **Context**: Web browsers do not provide a standard synchronous API to check whether an external application protocol (e.g. `nuvio://`) is registered on the operating system.
- **Decision**: Implement a focus/visibility detection pattern:
  1. Trigger protocol scheme via an isolated hidden `<iframe>` or temporary anchor click.
  2. Attach temporary listeners for `blur` and `visibilitychange`.
  3. If the application is registered and opened (or the browser shows its native protocol prompt), the page loses focus (`blur`) or becomes hidden (`document.hidden = true`).
  4. If a timeout (default: 1500ms) elapses without focus change, treat the desktop application as unavailable and invoke the web fallback.
- **Consequences**: Works reliably across Chrome, Brave, Opera, Edge, and Firefox without requiring native messaging hosts or invasive operating system binaries.

---

### ADR-003: In-Page Permission Dialog with "Always Allow" Preference

- **Status**: Accepted
- **Context**: Users expect transparency and control over when external desktop applications are invoked versus opening the web client. The user requirement explicitly calls for a browser-native-like popup with an "Always allow" option and fallback to web when cancelled.
- **Decision**: Provide an in-page modal dialog (`src/utils/modal.js`) matching Google and browser system prompt aesthetics:
  - Header with official Nuvio logo and clear origin text ("https://www.google.com wants to open this application").
  - Clear title and media metadata card.
  - Checkbox: "Always allow google.com to open links in Nuvio Desktop".
  - Dedicated buttons for "Open Nuvio App", "Open in Web", and "Cancel".
  - If cancelled, keep the default to ask each time and cleanly close the dialog without intrusive notifications.
  - While open, locks background scrolling to maintain focus and prevent background disalignment.
- **Consequences**: Gives the user full authority over app launches, prevents unintentional app triggers, and matches expected browser security dialog behavior.

---

### ADR-004: Multi-Target DOM Anchor Strategy in Google Search

- **Status**: Accepted
- **Context**: Google Search Knowledge Panels change dynamically depending on the search query, geographic region, display language, and device viewport. Relying on a single CSS selector frequently breaks during Google SERP updates.
- **Decision**: Implement a multi-target injection strategy:
  1. Primary: "Where to Watch" list container (`div[data-attrid*="media_actions"]`).
  2. Secondary: Action header row alongside Watchlist / Share controls.
  3. Tertiary: Floating Action Pill (FAB) fallback when entity metadata (IMDb or film/TV Knowledge Panel) is present but Google provides no streaming providers for the region.
  4. Use a debounced `MutationObserver` on `#rcnt` and `document.body` to handle single-page AJAX navigations.
- **Consequences**: Maximum resilience against layout shifts, A/B testing variations, and international Google domains.

---

### ADR-005: Companion Script for Web Client Auto-Search

- **Status**: Accepted
- **Context**: Opening `https://nuvio-web.vercel.app/` as a fallback should take the user directly to the movie or show, rather than dropping them on an empty search bar.
- **Decision**: Include a lightweight content script targeting `https://nuvio-web.vercel.app/*` that reads query parameters (`?q=...`), sets `sessionStorage.lastSearchQuery`, and simulates synthetic input events on the search bar to trigger automatic search results.
- **Consequences**: Seamless end-to-end user experience across both desktop and web paths.

---

### ADR-006: Zero External Runtime Dependencies

- **Status**: Accepted
- **Context**: Modern extension security requires avoiding bloated dependency chains and untrusted third-party npm bundles.
- **Decision**: Build the entire extension using native modern JavaScript (ES6+), standard WebExtension APIs, and pure CSS.
- **Consequences**: Zero build friction, instant loading speed, minimal memory footprint, and streamlined review compliance for Chrome Web Store and Firefox Add-ons.
