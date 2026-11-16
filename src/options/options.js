/**
 * Options Page Controller for Nuvio for Google Search.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const selectLaunchMode = document.getElementById('select-launch-mode');
  const inputProtocolScheme = document.getElementById('input-protocol-scheme');
  const inputWebUrl = document.getElementById('input-web-url');
  const inputTimeout = document.getElementById('input-timeout');
  const cbFabFallback = document.getElementById('cb-fab-fallback');
  const cbAutoSearch = document.getElementById('cb-auto-search');
  const btnSave = document.getElementById('btn-save');
  const btnReset = document.getElementById('btn-reset-all');
  const statusEl = document.getElementById('save-status');

  function showStatus(text, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = isError ? '#e74c3c' : '#2ecc71';
    statusEl.classList.add('visible');
    setTimeout(() => {
      statusEl.classList.remove('visible');
    }, 2500);
  }

  // Load and populate fields
  async function loadSettings() {
    const settings = await window.NuvioStorage.getSettings();

    if (selectLaunchMode) selectLaunchMode.value = settings.launchMode || 'ask';
    if (inputProtocolScheme) inputProtocolScheme.value = settings.protocolScheme || 'nuvio://';
    if (inputWebUrl) inputWebUrl.value = settings.webBaseUrl || 'https://nuvio-web.vercel.app/';
    if (inputTimeout) inputTimeout.value = settings.timeoutMs || 1500;
    if (cbFabFallback) cbFabFallback.checked = settings.enableFabFallback !== false;
    if (cbAutoSearch) cbAutoSearch.checked = settings.autoSearchWeb !== false;
  }

  await loadSettings();

  // Save Settings
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      let scheme = (inputProtocolScheme.value || 'nuvio://').trim();
      if (!scheme.includes('://')) {
        scheme = `${scheme}:/`;
      }

      let webUrl = (inputWebUrl.value || 'https://nuvio-web.vercel.app/').trim();
      if (!webUrl.startsWith('http://') && !webUrl.startsWith('https://')) {
        webUrl = `https://${webUrl}`;
      }
      if (!webUrl.endsWith('/')) {
        webUrl = `${webUrl}/`;
      }

      let timeout = parseInt(inputTimeout.value, 10);
      if (isNaN(timeout) || timeout < 500) {
        timeout = 500;
      } else if (timeout > 5000) {
        timeout = 5000;
      }
      inputTimeout.value = timeout;

      const newSettings = {
        launchMode: selectLaunchMode.value,
        protocolScheme: scheme,
        webBaseUrl: webUrl,
        timeoutMs: timeout,
        enableFabFallback: cbFabFallback.checked,
        autoSearchWeb: cbAutoSearch.checked
      };

      const success = await window.NuvioStorage.saveSettings(newSettings);
      if (success) {
        showStatus('Settings saved successfully');
      } else {
        showStatus('Failed to save settings', true);
      }
    });
  }

  // Reset all settings
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (confirm('Reset all extension settings to their initial defaults?')) {
        await window.NuvioStorage.resetSettings();
        await loadSettings();
        showStatus('All settings restored to default');
      }
    });
  }
});
