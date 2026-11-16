# Google Search DOM Reverse Engineering & Selectors

## Google Knowledge Graph Architecture

Google Search serves rich entity cards (Knowledge Panels) for films, television series, and broadcast programs. These cards do not use standard semantic class names, as Google employs randomized hash classes (e.g. `.wDYxhc`, `.qrShPb`) that rotate between builds. Instead, Google relies on stable semantic attributes known as `data-attrid`.

## Target Selectors

### 1. Watch Providers & Media Actions Containers
Google clusters streaming availability under these containers:

```css
/* Movies / Films */
div[data-attrid="kc:/film/film:media_actions_wholepage"]

/* Television Series / Shows */
div[data-attrid="kc:/tv/tv_program:media_actions_wholepage"]

/* Broadcast Programs */
div[data-attrid="kc:/broadcast/broadcast_program:media_actions_wholepage"]

/* Generic Media Action Containers */
div[data-attrid*="media_actions"]
div[data-attrid*="watch_actions"]
div[data-attrid="action:watch"]
```

Inside these containers, Google typically provides a `div[role="list"]` or linear sequence of provider anchor tags (`<a ping="...">`). The extension prepends the Nuvio provider card to the top of this list.

### 2. Header Action Rows
Quick-action buttons (such as "Want to watch", "Watched it", and "Share") are rendered inside:

```css
div[data-attrid^="kc:/film/film:"] [role="group"]
div[data-attrid^="kc:/tv/tv_program:"] [role="group"]
div[data-attrid*="actions"] [role="group"]
```

The extension injects a pill button (`Watch on Nuvio`) directly into this button group.

### 3. Entity Metadata Selectors

#### Title Extraction
The title is resolved in priority order:
1. `div[data-attrid="title"]`
2. `div[data-attrid="kc:/film/film:title"]`
3. `div[data-attrid="kc:/tv/tv_program:title"]`
4. `h2[data-attrid="title"]`
5. `div[data-attrid*="title"] h2`
6. `h2.qrShPb` (Google Knowledge Panel header)
7. Query input fallback: `input[name="q"], textarea[name="q"]` (with query sanitization).

#### Content Type Classification
The media is classified as `series` if:
- `div[data-attrid^="kc:/tv/tv_program:"]` exists.
- `div[data-attrid*="broadcast_program"]` exists.
- Subtitle contains words: `tv series`, `television series`, `season`, `episodes`.
Otherwise, it defaults to `movie`.

#### IMDb Identification
If an IMDb link is present anywhere within the SERP or Knowledge Panel:
```javascript
const imdbLink = document.querySelector("a[href*='imdb.com/title/tt'], a[href*='m.imdb.com/title/tt']");
const imdbId = imdbLink?.href.match(/title\/(tt\d+)/i)?.[1];
```
This enables exact, 1:1 content resolution via `nuvio:///detail/{contentType}/{imdbId}`.

## Mutation Observer & Dynamic SPA Navigations

Google Search handles user queries dynamically without full page reloads:
- When a user modifies their search in the input bar or clicks auto-complete suggestions, Google performs client-side fetches and swaps `#rcnt` or `#search`.
- The extension attaches a debounced `MutationObserver` on `#rcnt` (or `document.body` if `#rcnt` is absent) with a 150ms debounce window.
- If mutations add elements, `extractMediaMetadata()` re-evaluates the page.
- Existing injected elements are tagged with `.nuvio-injected` and verified by element ID to avoid layout thrashing and duplicate buttons.
