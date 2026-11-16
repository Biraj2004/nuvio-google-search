/**
 * Desktop Protocol Launcher with Smart Web Fallback Detection.
 */
(function (global) {
  'use strict';

  const NuvioLauncher = {
    /**
     * Build the desktop protocol URL for the given media item.
     *
     * @param {Object} media - { title, contentType, imdbId }
     * @param {string} scheme - Custom URI scheme (default: 'nuvio://')
     * @returns {string} Protocol URI
     */
    buildProtocolUri(media, scheme = 'nuvio://') {
      const cleanScheme = scheme.endsWith('://') ? scheme : `${scheme.replace(/:?\/*$/, '')}://`;
      const type = media.contentType || 'movie';

      if (media.imdbId) {
        // Nuvio / Stremio compatible detail route
        return `${cleanScheme}/detail/${type}/${media.imdbId}`;
      }

      const query = encodeURIComponent(media.title || '');
      return `${cleanScheme}search?q=${query}`;
    },

    /**
     * Build the Nuvio Web fallback URL for the given media item.
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
        // Use background script or window.open
        global.nuvioBrowser.runtime.sendMessage({ action: 'openTab', url: url }).catch(() => {
          window.open(url, '_blank', 'noopener,noreferrer');
        });
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },

    /**
     * Trigger protocol URI via hidden iframe or anchor tag.
     *
     * @param {string} uri
     */
    triggerProtocol(uri) {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.opacity = '0';
        iframe.style.border = 'none';
        iframe.src = uri;
        document.body.appendChild(iframe);

        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      } catch (e) {
        // Fallback to location navigation if iframe is blocked
        const a = document.createElement('a');
        a.href = uri;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 1000);
      }
    },

    /**
     * Launch desktop application with fallback detection.
     *
     * @param {string} protocolUri
     * @param {string} webFallbackUrl
     * @param {number} timeoutMs
     * @param {Function} onResult
     */
    launchWithFallback(protocolUri, webFallbackUrl, timeoutMs = 1500, onResult = null) {
      let appLaunched = false;
      let timer = null;

      const handleBlur = () => {
        appLaunched = true;
        cleanup();
        if (typeof onResult === 'function') {
          onResult('launched');
        }
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          appLaunched = true;
          cleanup();
          if (typeof onResult === 'function') {
            onResult('launched');
          }
        }
      };

      const cleanup = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };

      window.addEventListener('blur', handleBlur, { once: true });
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Trigger the protocol scheme
      this.triggerProtocol(protocolUri);

      // Start detection timeout
      timer = setTimeout(() => {
        cleanup();
        if (!appLaunched && !document.hidden) {
          // Desktop application was not detected or cancelled
          if (global.NuvioUI) {
            global.NuvioUI.showToast(
              'Nuvio Desktop app not detected. Opening in Nuvio Web...',
              null,
              null,
              3000
            );
          }
          this.openInNewTab(webFallbackUrl);
          if (typeof onResult === 'function') {
            onResult('fallback');
          }
        }
      }, timeoutMs);
    },

    /**
     * Execute watch action based on current user configuration and preferences.
     *
     * @param {Object} media - { title, year, contentType, imdbId }
     */
    async launch(media) {
      const settings = await global.NuvioStorage.getSettings();
      const protocolUri = this.buildProtocolUri(media, settings.protocolScheme);
      const webUrl = this.buildWebUrl(media, settings.webBaseUrl);

      const mode = settings.launchMode || 'ask';

      if (mode === 'web') {
        this.openInNewTab(webUrl);
        return;
      }

      if (mode === 'desktop') {
        this.triggerProtocol(protocolUri);
        return;
      }

      if (mode === 'smart') {
        this.launchWithFallback(protocolUri, webUrl, settings.timeoutMs);
        return;
      }

      // Default: 'ask' - Prompt user with native-style permission dialog
      if (global.NuvioUI) {
        global.NuvioUI.showLaunchModal(
          media,
          { protocolUri, webUrl, currentSettings: settings },
          async ({ action, remember }) => {
            if (action === 'app') {
              if (remember) {
                await global.NuvioStorage.setLaunchMode('smart', true);
              }
              this.launchWithFallback(protocolUri, webUrl, settings.timeoutMs);
            } else if (action === 'web') {
              if (remember) {
                await global.NuvioStorage.setLaunchMode('web', true);
              }
              this.openInNewTab(webUrl);
            } else {
              // User cancelled app launch
              // Keep preference as 'ask' each time, and provide subtle web prompt
              if (settings.webPromptOnCancel && global.NuvioUI) {
                global.NuvioUI.showToast(
                  'App launch cancelled.',
                  'Open in Web',
                  () => this.openInNewTab(webUrl),
                  5000
                );
              }
            }
          }
        );
      } else {
        // Fallback if UI is not loaded
        this.launchWithFallback(protocolUri, webUrl, settings.timeoutMs);
      }
    }
  };

  global.NuvioLauncher = NuvioLauncher;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this));
