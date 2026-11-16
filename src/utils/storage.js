/**
 * Configuration and Storage Management for Nuvio for Google Search.
 */
(function (global) {
  'use strict';

  const DEFAULT_SETTINGS = {
    // 'ask' = Prompt user with browser-like launch dialog
    // 'smart' = Attempt desktop protocol first, automatically fallback to web on failure
    // 'desktop' = Only launch desktop app
    // 'web' = Only open in Nuvio Web
    launchMode: 'ask',

    // Protocol scheme for Nuvio Desktop app
    protocolScheme: 'nuvio://',

    // Base URL for Nuvio Web client
    webBaseUrl: 'https://nuvio-web.vercel.app/',

    // Milliseconds to wait for OS protocol handler before triggering web fallback
    timeoutMs: 1500,

    // Show floating action button when Google Knowledge panel has no streaming chip
    enableFabFallback: true,

    // Automatically trigger search on Nuvio Web when navigated
    autoSearchWeb: true,

    // User opted to remember decision
    rememberChoice: false
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
     * Set the user's permanent launch choice.
     */
    async setLaunchMode(mode, remember = true) {
      return this.saveSettings({
        launchMode: mode,
        rememberChoice: remember
      });
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
