# Configuration & Settings Guide

## Storage Schema

All user preferences are persisted using the browser's synchronized storage API (`chrome.storage.sync` or fallback `chrome.storage.local`).

| Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `webBaseUrl` | `string` | `'https://nuvio-web.vercel.app/'` | Nuvio Web streaming application endpoint. |
| `enableFabFallback` | `boolean` | `true` | Render floating action button if Google omits provider panel. |
| `autoSearchWeb` | `boolean` | `true` | Injects companion script to trigger search on Nuvio Web. |

---

## Direct Web Launch Behavior

When clicking "Watch on Nuvio" or "Watch" in Google Search, the extension immediately:
1. Gathers the entity title, release year, content type (movie or series), and IMDb ID.
2. Formats the search URL targeting `https://nuvio-web.vercel.app/search?q={title}&imdb={imdbId}&type={type}`.
3. Opens the URL in a new browser tab with zero prompts, zero native protocol handlers, and zero desktop app dependencies.
4. The companion script on `nuvio-web.vercel.app` automatically populates the search query and renders streaming results.

---

## Advanced Customization

### Self-Hosted Web Client
If you host an instance of Nuvio Web (via Docker or Vercel), update the `webBaseUrl` in the Options page:
```
https://my-nuvio-web.internal.domain/
```
The extension will route all searches to your custom instance and auto-populate titles.
