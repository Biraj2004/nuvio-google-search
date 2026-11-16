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

### ADR-002: Direct Web Client Streaming (Zero Windows App Requirement, Zero Popups)

- **Status**: Accepted (Supersedes prior protocol detection & modal prompt)
- **Context**: Relying on custom Windows desktop protocol schemes (`nuvio://`) and displaying intermediate permission modal prompts introduces unnecessary cognitive load, browser warnings, and launch latency. Users prefer directly streaming movies and series online.
- **Decision**: Streamline the watch action directly to the Nuvio Web streaming client (`https://nuvio-web.vercel.app/`):
  1. Clicking "Watch on Nuvio" immediately navigates to Nuvio Web in a new tab.
  2. Bypasses all Windows desktop application protocols, timeouts, and native confirmation gates.
  3. Eliminates all in-page modal dialogs and background scroll interruptions.
- **Consequences**: Instantaneous one-click streaming, zero platform-specific protocol hurdles, zero permission dialog friction, and optimal cross-browser reliability.

---

### ADR-003: High-Fidelity Brand Integration in Google Search Knowledge Panels

- **Status**: Accepted
- **Context**: The injected Nuvio streaming action should look like a first-class, authentic streaming service directly within Google's "Where to Watch" provider stack.
- **Decision**: Render official Nuvio squircle provider branding alongside other major platforms (Netflix, Prime Video, Disney+), displaying "Free" badges and "Watch" action chips matching Google Search native design language.
- **Consequences**: Familiar, high-trust user experience with zero visual drift.

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
