/**
 * Popup Menu Controller for Nuvio for Google Search.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const btnOpenWeb = document.getElementById('btn-open-web');
  const btnOptions = document.getElementById('btn-open-options');
  const targetWebUrl = document.getElementById('target-web-url');
  const versionEl = document.getElementById('extension-version');

  // Display version
  if (versionEl && window.nuvioBrowser && window.nuvioBrowser.raw && window.nuvioBrowser.raw.runtime && window.nuvioBrowser.raw.runtime.getManifest) {
    versionEl.textContent = `v${window.nuvioBrowser.raw.runtime.getManifest().version}`;
  }

  // Load current webBaseUrl
  const settings = await window.NuvioStorage.getSettings();
  const webUrl = settings.webBaseUrl || 'https://nuvio-web.vercel.app/';
  if (targetWebUrl) {
    targetWebUrl.textContent = webUrl;
  }

  // Open Web Client button
  if (btnOpenWeb) {
    btnOpenWeb.addEventListener('click', () => {
      if (window.nuvioBrowser && window.nuvioBrowser.runtime) {
        window.nuvioBrowser.runtime.sendMessage({ action: 'openTab', url: webUrl }).catch(() => {
          window.open(webUrl, '_blank', 'noopener,noreferrer');
        });
      } else {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }
    });
  }

  // Open Options page
  if (btnOptions) {
    btnOptions.addEventListener('click', () => {
      if (window.nuvioBrowser && window.nuvioBrowser.raw && window.nuvioBrowser.raw.runtime && window.nuvioBrowser.raw.runtime.openOptionsPage) {
        window.nuvioBrowser.raw.runtime.openOptionsPage();
      } else {
        window.open('../options/options.html');
      }
    });
  }
});
