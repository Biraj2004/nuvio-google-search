/**
 * Popup Menu Controller for Nuvio for Google Search.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const modeRadios = document.querySelectorAll('input[name="launchMode"]');
  const btnReset = document.getElementById('btn-reset-decision');
  const btnOptions = document.getElementById('btn-open-options');
  const versionEl = document.getElementById('extension-version');

  // Display version
  if (versionEl && window.nuvioBrowser.raw.runtime && window.nuvioBrowser.raw.runtime.getManifest) {
    versionEl.textContent = `v${window.nuvioBrowser.raw.runtime.getManifest().version}`;
  }

  // Load current settings
  const settings = await window.NuvioStorage.getSettings();
  const currentMode = settings.launchMode || 'ask';

  const activeRadio = document.querySelector(`input[name="launchMode"][value="${currentMode}"]`);
  if (activeRadio) {
    activeRadio.checked = true;
  }

  // Change handler
  modeRadios.forEach((radio) => {
    radio.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const selectedMode = e.target.value;
        await window.NuvioStorage.saveSettings({
          launchMode: selectedMode,
          rememberChoice: selectedMode !== 'ask'
        });
      }
    });
  });

  // Reset saved decision button
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      await window.NuvioStorage.saveSettings({
        launchMode: 'ask',
        rememberChoice: false
      });

      const askRadio = document.getElementById('mode-ask');
      if (askRadio) {
        askRadio.checked = true;
      }

      btnReset.textContent = 'Decision Reset!';
      setTimeout(() => {
        btnReset.textContent = 'Reset Saved Decision';
      }, 1500);
    });
  }

  // Open Options page
  if (btnOptions) {
    btnOptions.addEventListener('click', () => {
      if (window.nuvioBrowser.raw.runtime.openOptionsPage) {
        window.nuvioBrowser.raw.runtime.openOptionsPage();
      } else {
        window.open(window.nuvioBrowser.raw.runtime.getURL('options/options.html'));
      }
    });
  }
});
