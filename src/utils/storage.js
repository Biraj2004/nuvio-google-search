/**
 * Configuration and Storage Management for Nuvio for Google Search.
 * Direct web streaming configuration.
 */
(function (global) {
  'use strict';

  const DEFAULT_SETTINGS = {
    // Base URL for Nuvio Web client
    webBaseUrl: 'https://nuvio-web.vercel.app/',

    // Show floating action button when Google Knowledge panel has no streaming chip
    enableFabFallback: true,

    // Automatically trigger search on Nuvio Web when navigated
    autoSearchWeb: true
  };

  const NuvioStorage = {
    DEFAULTS: DEFAULT_SETTINGS,

    /**
     * Get all settings with defaults applied.
     */
    async getSettings() {
      try {
        const stored = await global.nuvioBrowser.storage.sync.get(DEFAULT_SETTINGS);
        return Object.assign({}, DEFAULT_SETTINGS, stored);
      } catch (e) {
        console.warn('[Nuvio] Failed to load settings from storage:', e);
        return Object.assign({}, DEFAULT_SETTINGS);
      }
    },

    /**
     * Save one or more settings.
     */
    async saveSettings(settings) {
      try {
        await global.nuvioBrowser.storage.sync.set(settings);
        return true;
      } catch (e) {
        console.error('[Nuvio] Failed to save settings to storage:', e);
        return false;
      }
    },

    /**
     * Reset settings back to initial defaults.
     */
    async resetSettings() {
      try {
        await global.nuvioBrowser.storage.sync.set(DEFAULT_SETTINGS);
        return true;
      } catch (e) {
        console.error('[Nuvio] Failed to reset settings:', e);
        return false;
      }
    }
  };

  global.NuvioStorage = NuvioStorage;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this));
