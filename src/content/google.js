/**
 * Content script injected into Google Search.
 * Detects movie and series Knowledge Panels and injects Nuvio watch buttons.
 */
(function () {
  'use strict';

  const INJECTED_CLASS = 'nuvio-injected';
  const NUVIO_CARD_ID = 'nuvio-watch-provider-card';
  const NUVIO_HEADER_BTN_ID = 'nuvio-header-action-btn';
  const NUVIO_FAB_ID = 'nuvio-floating-action-pill';

  let currentMedia = null;
  let observer = null;
  let debounceTimer = null;

  /**
   * Helper to clean search query into a likely title.
   */
  function cleanSearchQuery(query) {
    if (!query) return '';
    return query
      .replace(/\b(where\s+to\s+watch|watch|streaming|stream|free\s+online|movie|film|series|tv\s+show|season|episode|online|full)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Extract movie or TV show metadata from the current Google search DOM.
   */
  function extractMediaMetadata() {
    // 1. Detect IMDb code if present on the page
    let imdbId = null;
    const imdbLink = document.querySelector("a[href*='imdb.com/title/tt'], a[href*='m.imdb.com/title/tt']");
    if (imdbLink && imdbLink.href) {
      const match = imdbLink.href.match(/title\/(tt\d+)/i);
      if (match) {
        imdbId = match[1];
      }
    }

    // 2. Detect Content Type (movie vs series/tv)
    let contentType = 'movie';
    const isSeriesContainer = document.querySelector(
      "div[data-attrid^='kc:/tv/tv_program:'], div[data-attrid*='tv_program'], div[data-attrid*='broadcast_program']"
    );
    const subtitleText = (document.querySelector("div[data-attrid='subtitle'], div[data-attrid*='subtitle']")?.textContent || '').toLowerCase();
    const bodySnippet = document.body ? document.body.innerText.slice(0, 3000).toLowerCase() : '';

    if (
      isSeriesContainer ||
      subtitleText.includes('tv series') ||
      subtitleText.includes('television series') ||
      subtitleText.includes('season') ||
      subtitleText.includes('episodes')
    ) {
      contentType = 'series';
    }

    // 3. Extract Title
    let title = null;
    const titleCandidates = [
      document.querySelector("div[data-attrid='title']"),
      document.querySelector("div[data-attrid='kc:/film/film:title']"),
      document.querySelector("div[data-attrid='kc:/tv/tv_program:title']"),
      document.querySelector("h2[data-attrid='title']"),
      document.querySelector("div[data-attrid*='title'] h2"),
      document.querySelector(".qrShPb"),
      document.querySelector("div[role='heading'][aria-level='2']")
    ];

    for (const el of titleCandidates) {
      if (el && el.textContent && el.textContent.trim()) {
        const text = el.textContent.trim();
        // Skip generic headers
        if (!text.toLowerCase().includes('result') && !text.toLowerCase().includes('search')) {
          title = text;
          break;
        }
      }
    }

    // Fallback: extract from search query input
    if (!title) {
      const searchInput = document.querySelector("input[name='q'], textarea[name='q']");
      if (searchInput && searchInput.value) {
        title = cleanSearchQuery(searchInput.value);
      }
    }

    // 4. Extract Release Year
    let year = null;
    if (subtitleText) {
      const yearMatch = subtitleText.match(/\b(19\d{2}|20\d{2})\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
      }
    }

    // Return null if neither title nor IMDb could be resolved
    if (!title && !imdbId) {
      return null;
    }

    return {
      title: title || (contentType === 'series' ? 'TV Show' : 'Movie'),
      year: year,
      contentType: contentType,
      imdbId: imdbId
    };
  }

  /**
   * Create the provider card element to inject into "Where to Watch" list.
   */
  function createProviderCard(media) {
    const card = document.createElement('div');
    card.id = NUVIO_CARD_ID;
    card.className = `nuvio-provider-card ${INJECTED_CLASS}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const iconUrl = window.nuvioBrowser.runtime.getURL('icons/icon-48.png');

    card.innerHTML = `
      <img src="${iconUrl}" alt="Nuvio" class="nuvio-provider-icon" />
      <div class="nuvio-provider-info">
        <div class="nuvio-provider-name-row">
          <span class="nuvio-provider-name">Nuvio</span>
          <span class="nuvio-provider-badge">Free</span>
        </div>
        <div class="nuvio-provider-meta">Desktop App · Web Client</div>
      </div>
      <div class="nuvio-provider-cta">Watch</div>
    `;

    const handleAction = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.NuvioLauncher) {
        window.NuvioLauncher.launch(media);
      }
    };

    card.addEventListener('click', handleAction);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleAction(e);
      }
    });

    return card;
  }

  /**
   * Create the header action pill button (alongside Watchlist / Share).
   */
  function createHeaderActionButton(media) {
    const btn = document.createElement('a');
    btn.id = NUVIO_HEADER_BTN_ID;
    btn.className = `nuvio-header-action-btn ${INJECTED_CLASS}`;
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.href = '#';

    const iconUrl = window.nuvioBrowser.runtime.getURL('icons/icon-32.png');

    btn.innerHTML = `
      <img src="${iconUrl}" alt="Nuvio" class="nuvio-header-action-icon" />
      <span>Watch on Nuvio</span>
    `;

    const handleAction = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.NuvioLauncher) {
        window.NuvioLauncher.launch(media);
      }
    };

    btn.addEventListener('click', handleAction);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleAction(e);
      }
    });

    return btn;
  }

  /**
   * Create the floating action pill (FAB) fallback.
   */
  function createFloatingActionPill(media) {
    const fab = document.createElement('div');
    fab.id = NUVIO_FAB_ID;
    fab.className = `nuvio-fab ${INJECTED_CLASS}`;
    fab.setAttribute('role', 'button');
    fab.setAttribute('tabindex', '0');

    const iconUrl = window.nuvioBrowser.runtime.getURL('icons/icon-32.png');

    fab.innerHTML = `
      <img src="${iconUrl}" alt="Nuvio" class="nuvio-fab-icon" />
      <span>Watch on Nuvio</span>
    `;

    const handleAction = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.NuvioLauncher) {
        window.NuvioLauncher.launch(media);
      }
    };

    fab.addEventListener('click', handleAction);
    fab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleAction(e);
      }
    });

    // Hide FAB on scroll down, show on scroll up
    let lastScrollY = window.scrollY;
    window.addEventListener(
      'scroll',
      () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 150) {
          fab.classList.add('nuvio-fab-hidden');
        } else {
          fab.classList.remove('nuvio-fab-hidden');
        }
        lastScrollY = currentScrollY;
      },
      { passive: true }
    );

    return fab;
  }

  /**
   * Main injection logic into Google SERP.
   */
  async function injectNuvio() {
    const media = extractMediaMetadata();
    if (!media) {
      removeInjectedElements();
      return;
    }

    currentMedia = media;

    // Load settings
    const settings = window.NuvioStorage ? await window.NuvioStorage.getSettings() : { enableFabFallback: true };

    let injectedInPanel = false;

    // Target 1: Watch Options / Media Actions Container
    const watchContainers = document.querySelectorAll(`
      div[data-attrid='kc:/tv/tv_program:media_actions_wholepage'],
      div[data-attrid='kc:/film/film:media_actions_wholepage'],
      div[data-attrid='kc:/broadcast/broadcast_program:media_actions_wholepage'],
      div[data-attrid*='media_actions'],
      div[data-attrid*='watch_actions'],
      div[data-attrid='action:watch']
    `);

    if (watchContainers.length > 0) {
      watchContainers.forEach((container) => {
        if (container.querySelector(`#${NUVIO_CARD_ID}`)) {
          injectedInPanel = true;
          return;
        }

        // Try to find the list container inside media_actions
        const listContainer = container.querySelector("div[role='list']") || container.firstElementChild || container;
        const card = createProviderCard(media);

        if (listContainer) {
          // Prepend as top recommended watch option or append cleanly
          if (listContainer.firstChild) {
            listContainer.insertBefore(card, listContainer.firstChild);
          } else {
            listContainer.appendChild(card);
          }
          injectedInPanel = true;
        }
      });
    }

    // Target 2: Header action bar (alongside Watchlist / Share buttons)
    const actionRow = document.querySelector(
      "div[data-attrid^='kc:/film/film:'] [role='group'], div[data-attrid^='kc:/tv/tv_program:'] [role='group'], div[data-attrid*='actions'] [role='group']"
    );

    if (actionRow && !actionRow.querySelector(`#${NUVIO_HEADER_BTN_ID}`)) {
      const headerBtn = createHeaderActionButton(media);
      actionRow.insertBefore(headerBtn, actionRow.firstChild);
      injectedInPanel = true;
    }

    // Target 3: Fallback Floating Pill
    const existingFab = document.getElementById(NUVIO_FAB_ID);
    if (!injectedInPanel && settings.enableFabFallback) {
      const hasKnowledgePanel = Boolean(
        document.querySelector("div[data-attrid^='kc:/film/'], div[data-attrid^='kc:/tv/'], div[data-attrid='title']")
      );

      if (hasKnowledgePanel && !existingFab) {
        const fab = createFloatingActionPill(media);
        document.body.appendChild(fab);
      }
    } else if (injectedInPanel && existingFab) {
      // If we successfully injected into the panel, no need for floating button
      existingFab.remove();
    }
  }

  /**
   * Remove previously injected elements if page context changed.
   */
  function removeInjectedElements() {
    const elements = document.querySelectorAll(`.${INJECTED_CLASS}`);
    elements.forEach((el) => el.remove());
  }

  /**
   * Debounced runner to avoid excessive DOM queries during rapid mutations.
   */
  function scheduleInject() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      injectNuvio();
    }, 150);
  }

  /**
   * Initialize observer and event listeners.
   */
  function init() {
    // Initial run
    scheduleInject();

    // Observe dynamic SERP updates (SPA transitions, infinite scroll, query updates)
    const targetNode = document.getElementById('rcnt') || document.body;
    if (targetNode) {
      observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        for (const m of mutations) {
          if (m.addedNodes && m.addedNodes.length > 0) {
            shouldUpdate = true;
            break;
          }
        }
        if (shouldUpdate) {
          scheduleInject();
        }
      });

      observer.observe(targetNode, {
        childList: true,
        subtree: true
      });
    }

    // Listen to history navigation
    window.addEventListener('popstate', scheduleInject);
    window.addEventListener('hashchange', scheduleInject);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
