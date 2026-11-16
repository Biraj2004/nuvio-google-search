# Configuration & Settings Guide

## Storage Schema

All user preferences are persisted using the browser's synchronized storage API (`chrome.storage.sync` or fallback `chrome.storage.local`).

| Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `launchMode` | `string` | `'ask'` | Behavior on click: `'ask'`, `'smart'`, `'web'`, `'desktop'`. |
| `protocolScheme` | `string` | `'nuvio://'` | Custom URI scheme registered by the desktop application. |
| `webBaseUrl` | `string` | `'https://nuvio-web.vercel.app/'` | Fallback web application endpoint. |
| `timeoutMs` | `number` | `1500` | Milliseconds to wait before declaring desktop app missing. |
| `enableFabFallback` | `boolean` | `true` | Render floating action button if Google omits provider panel. |
| `rememberChoice` | `boolean` | `false` | Indicates if the user checked "Always allow". |
| `autoSearchWeb` | `boolean` | `true` | Injects companion script to trigger search on Nuvio Web. |

---

## Launch Modes Explained

### 1. `ask` (Default)
When clicking "Watch on Nuvio" in Google Search, the extension displays a native-style permission dialog:
- Displays title, release year, content type, and IMDb ID.
- Checkbox: **"Always allow google.com to open links in Nuvio Desktop"**.
- Actions:
  - **Open Nuvio App**: Initiates desktop protocol launch with smart fallback. If "Always allow" was checked, persists `launchMode: 'smart'`.
  - **Open in Web**: Immediately opens `nuvio-web.vercel.app` in a new tab. If "Always allow" was checked, persists `launchMode: 'web'`.
  - **Cancel**: Closes dialog cleanly and maintains `'ask'` mode for subsequent searches.

### 2. `smart`
Directly triggers the desktop application (`nuvio://`). Simultaneously runs a protocol detection timer:
- If the desktop app opens (focus changes / page hides), the turn succeeds.
- If the timer expires (default: 1500ms) without focus change, it automatically opens `https://nuvio-web.vercel.app/` in a new tab with the title pre-filled.

### 3. `web`
Bypasses desktop application checks entirely and opens the title directly in the Nuvio Web client in a new tab.

### 4. `desktop`
Only attempts to launch the desktop application via protocol scheme without opening the web client.

---

## Advanced Customization

### Alternative Desktop Protocol Schemes
If you are running custom forks or Stremio-compatible clients alongside Nuvio, you can adjust `protocolScheme` in the Options page:
- `nuvio://` (Official Nuvio Desktop)
- `stremio://` (Stremio Ecosystem)

### Self-Hosted Web Client
If you host an instance of Nuvio Web (via Docker or Vercel), update the `webBaseUrl` in the Options page:
```
https://my-nuvio-web.internal.domain/
```
The extension will route all web fallbacks to your custom instance and auto-populate searches.
