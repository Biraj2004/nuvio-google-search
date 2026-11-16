/**
 * Companion script for Nuvio Web client (https://nuvio-web.vercel.app/*).
 * Automatically populates and triggers search when launched with ?q= parameter.
 */
(function () {
  'use strict';

  function handleAutoSearch() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || params.get('query') || params.get('title');

    if (!query || !query.trim()) {
      return;
    }

    const cleanQuery = query.trim();

    // 1. Populate sessionStorage so Next.js search state initializes immediately
    try {
      sessionStorage.setItem('lastSearchQuery', cleanQuery);
    } catch (e) {
      // Ignore sessionStorage restrictions if private mode
    }

    // 2. Poll for the search input element to update React state
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(() => {
      attempts++;
      const input = document.querySelector("input[placeholder*='Search'], input[type='text']");

      if (input) {
        clearInterval(interval);

        // Only set if not already typed by user
        if (!input.value || input.value === cleanQuery) {
          // Native value setter to trigger React's synthetic onChange
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          ).set;

          nativeInputValueSetter.call(input, cleanQuery);

          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          // Trigger Enter keydown if needed
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleAutoSearch);
  } else {
    handleAutoSearch();
  }
})();
