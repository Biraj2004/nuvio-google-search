/**
 * Direct Nuvio Web Launcher for Google Search.
 * Opens movies and series directly in Nuvio Web (https://nuvio-web.vercel.app/).
 * Zero Windows app invocation, zero popups.
 */
(function (global) {
  'use strict';

  const NuvioLauncher = {
    /**
     * Build the Nuvio Web URL for the given media item.
     *
     * @param {Object} media - { title, contentType, imdbId }
     * @param {string} baseUrl - Base URL for Nuvio Web
     * @returns {string} Web URL
     */
    buildWebUrl(media, baseUrl = 'https://nuvio-web.vercel.app/') {
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const params = new URLSearchParams();

      if (media.title) {
        params.set('q', media.title);
      }
      if (media.imdbId) {
        params.set('imdb', media.imdbId);
      }
      if (media.contentType) {
        params.set('type', media.contentType);
      }

      return `${cleanBase}search?${params.toString()}`;
    },

    /**
     * Open a URL in a new browser tab safely.
     *
     * @param {string} url
     */
    openInNewTab(url) {
      if (global.nuvioBrowser && global.nuvioBrowser.runtime) {
        global.nuvioBrowser.runtime.sendMessage({ action: 'openTab', url: url }).catch(() => {
          window.open(url, '_blank', 'noopener,noreferrer');
        });
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },

    /**
     * Directly launch the title in Nuvio Web in a new tab.
     *
     * @param {Object} media - { title, year, contentType, imdbId }
     */
    async launch(media) {
      const settings = (global.NuvioStorage && typeof global.NuvioStorage.getSettings === 'function')
        ? await global.NuvioStorage.getSettings()
        : { webBaseUrl: 'https://nuvio-web.vercel.app/' };

      const webUrl = this.buildWebUrl(media, settings.webBaseUrl);
      this.openInNewTab(webUrl);
    }
  };

  global.NuvioLauncher = NuvioLauncher;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this));
