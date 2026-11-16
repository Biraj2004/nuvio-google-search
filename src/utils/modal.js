/**
 * Native-style in-page prompt modal for Nuvio.
 * Styled without emojis, clean typography, dark/light theme aware,
 * with background scroll lock while open.
 */
(function (global) {
  'use strict';

  const MODAL_ID = 'nuvio-launch-modal-container';
  const SCROLL_LOCK_CLASS = 'nuvio-modal-open';

  const NuvioUI = {
    /**
     * Show modal asking user whether to open in desktop app or web.
     * Locks background scrolling while displayed.
     *
     * @param {Object} media - { title, year, contentType, imdbId }
     * @param {Object} options - { protocolUri, webUrl, currentSettings }
     * @param {Function} onConfirm - callback({ action: 'app' | 'web' | 'cancel', remember: boolean })
     */
    showLaunchModal(media, options, onConfirm) {
      this.closeModal();

      const container = document.createElement('div');
      container.id = MODAL_ID;
      container.className = 'nuvio-modal-backdrop';

      const logoUrl = global.nuvioBrowser.runtime.getURL('icons/nuvio-provider-48.png');
      const formattedTitle = media.title || 'Selected Title';
      const metaInfo = [
        media.contentType ? media.contentType.toUpperCase() : 'MEDIA',
        media.year ? String(media.year) : null,
        media.imdbId ? media.imdbId : null
      ].filter(Boolean).join(' · ');

      container.innerHTML = `
        <div class="nuvio-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="nuvio-modal-title">
          <div class="nuvio-modal-header">
            <div class="nuvio-modal-brand">
              <img src="${logoUrl}" alt="Nuvio" class="nuvio-modal-logo" />
              <div>
                <h3 id="nuvio-modal-title" class="nuvio-modal-heading">Open in Nuvio Desktop App?</h3>
                <p class="nuvio-modal-subheading">https://www.google.com wants to open this application.</p>
              </div>
            </div>
            <button type="button" class="nuvio-modal-close-btn" aria-label="Close dialog">&times;</button>
          </div>

          <div class="nuvio-modal-body">
            <div class="nuvio-media-card">
              <div class="nuvio-media-tag">${metaInfo}</div>
              <div class="nuvio-media-title">${this.escapeHtml(formattedTitle)}</div>
            </div>

            <p class="nuvio-modal-desc">
              Choose how you would like to watch this title. If the desktop app is not detected on your system,
              we will automatically open Nuvio Web instead.
            </p>

            <div class="nuvio-modal-checkbox-row">
              <label class="nuvio-checkbox-label">
                <input type="checkbox" id="nuvio-always-allow-cb" class="nuvio-checkbox-input" />
                <span class="nuvio-checkbox-text">Always allow google.com to open links in Nuvio Desktop</span>
              </label>
            </div>
          </div>

          <div class="nuvio-modal-footer">
            <button type="button" id="nuvio-btn-cancel" class="nuvio-btn nuvio-btn-secondary">Cancel</button>
            <button type="button" id="nuvio-btn-web" class="nuvio-btn nuvio-btn-secondary">Open in Web</button>
            <button type="button" id="nuvio-btn-app" class="nuvio-btn nuvio-btn-primary">Open Nuvio App</button>
          </div>
        </div>
      `;

      // Lock background scrolling on html and body
      if (document.documentElement) {
        document.documentElement.classList.add(SCROLL_LOCK_CLASS);
      }
      if (document.body) {
        document.body.classList.add(SCROLL_LOCK_CLASS);
      }

      document.body.appendChild(container);

      // Prevent mouse wheel and touch scrolling on background through backdrop
      const preventScroll = (e) => {
        const dialog = container.querySelector('.nuvio-modal-dialog');
        if (dialog && dialog.contains(e.target)) {
          if (dialog.scrollHeight > dialog.clientHeight) {
            return;
          }
        }
        e.preventDefault();
      };
      container.addEventListener('wheel', preventScroll, { passive: false });
      container.addEventListener('touchmove', preventScroll, { passive: false });

      // Event Listeners
      const closeBtn = container.querySelector('.nuvio-modal-close-btn');
      const cancelBtn = container.querySelector('#nuvio-btn-cancel');
      const webBtn = container.querySelector('#nuvio-btn-web');
      const appBtn = container.querySelector('#nuvio-btn-app');
      const alwaysAllowCb = container.querySelector('#nuvio-always-allow-cb');

      let cleanedUp = false;
      const handleClose = (action) => {
        if (cleanedUp) return;
        cleanedUp = true;
        const remember = alwaysAllowCb ? alwaysAllowCb.checked : false;
        this.closeModal();
        if (typeof onConfirm === 'function') {
          onConfirm({ action, remember });
        }
      };

      closeBtn.addEventListener('click', () => handleClose('cancel'));
      cancelBtn.addEventListener('click', () => handleClose('cancel'));
      webBtn.addEventListener('click', () => handleClose('web'));
      appBtn.addEventListener('click', () => handleClose('app'));

      // Backdrop click closes dialog
      container.addEventListener('click', (e) => {
        if (e.target === container) {
          handleClose('cancel');
        }
      });

      // Escape key closes dialog
      const keyHandler = (e) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', keyHandler);
          handleClose('cancel');
        }
      };
      document.addEventListener('keydown', keyHandler);

      // Focus primary action button
      setTimeout(() => {
        if (appBtn) appBtn.focus();
      }, 50);
    },

    /**
     * Close modal if open and restore background scrolling.
     */
    closeModal() {
      if (document.documentElement) {
        document.documentElement.classList.remove(SCROLL_LOCK_CLASS);
      }
      if (document.body) {
        document.body.classList.remove(SCROLL_LOCK_CLASS);
      }
      const existing = document.getElementById(MODAL_ID);
      if (existing) {
        existing.remove();
      }
    },

    /**
     * Escape HTML entities to prevent XSS.
     */
    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  global.NuvioUI = NuvioUI;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this));
