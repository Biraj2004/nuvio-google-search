/**
 * Background Service Worker for Nuvio for Google Search.
 * Handles tab creation, settings initialization, and cross-browser messaging.
 */

// Import polyfill if environment supports importScripts
if (typeof importScripts === 'function') {
  try {
    importScripts('../utils/browser-polyfill.js', '../utils/storage.js');
  } catch (e) {
    console.warn('[Nuvio Service Worker] Could not import scripts:', e);
  }
}

const api = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

/**
 * Initialize default configuration on installation or update.
 */
if (api && api.runtime) {
  api.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      const defaultSettings = {
        launchMode: 'ask',
        protocolScheme: 'nuvio://',
        webBaseUrl: 'https://nuvio-web.vercel.app/',
        timeoutMs: 1500,
        enableFabFallback: true,
        autoSearchWeb: true,
        rememberChoice: false
      };

      if (api.storage && api.storage.sync) {
        api.storage.sync.get(defaultSettings, (items) => {
          api.storage.sync.set(Object.assign({}, defaultSettings, items));
        });
      }
    }
  });

  /**
   * Listen for messages from content scripts or popup.
   */
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.action) {
      return false;
    }

    if (message.action === 'openTab' && message.url) {
      if (api.tabs && api.tabs.create) {
        api.tabs.create({ url: message.url, active: true }, (tab) => {
          sendResponse({ success: true, tabId: tab ? tab.id : null });
        });
        return true; // Keep channel open for async response
      }
    }

    if (message.action === 'ping') {
      sendResponse({ status: 'ok', version: api.runtime.getManifest ? api.runtime.getManifest().version : '1.0.0' });
      return false;
    }

    return false;
  });
}
