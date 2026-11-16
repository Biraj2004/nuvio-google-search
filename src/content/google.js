/**
 * Content script injected into Google Search.
 * Detects movie and series Knowledge Panels and injects Nuvio watch buttons.
 */
(function () {
  'use strict';

  const INJECTED_CLASS = 'nuvio-injected';
  const NUVIO_CARD_ID = 'nuvio-watch-provider-card';
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

    const iconUrl = window.nuvioBrowser.runtime.getURL('icons/nuvio-provider-48.png');

    card.innerHTML = `
      <img src="${iconUrl}" alt="Nuvio" class="nuvio-provider-icon" />
      <div class="nuvio-provider-info">
        <div class="nuvio-provider-name-row">
          <span class="nuvio-provider-name">Nuvio</span>
          <span class="nuvio-provider-badge">Free</span>
        </div>
        <div class="nuvio-provider-meta">Nuvio Web · Free Stream</div>
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
   * Create the floating action pill (FAB) fallback.
   */
  function createFloatingActionPill(media) {
    const fab = document.createElement('div');
    fab.id = NUVIO_FAB_ID;
    fab.className = `nuvio-fab ${INJECTED_CLASS}`;
    fab.setAttribute('role', 'button');
    fab.setAttribute('tabindex', '0');

    const iconUrl = window.nuvioBrowser.runtime.getURL('icons/nuvio-provider-32.png');

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
   * Find the streaming providers list container in the Google Knowledge Panel.
   * Targets the genuine "Where to watch" provider section (earlier placement).
   * Strictly avoids header action rows (Stremio / Already watched / Want to watch).
   */
  function findWatchProviderContainer() {
    const section = document.querySelector(`
      div[data-attrid='kc:/tv/tv_program:media_actions_wholepage'],
      div[data-attrid='kc:/film/film:media_actions_wholepage'],
      div[data-attrid='kc:/broadcast/broadcast_program:media_actions_wholepage'],
      div[data-attrid*='media_actions_wholepage'],
      div[data-attrid*='media_actions']:not([data-attrid*='header'])
    `);

    if (!section) {
      return null;
    }

    // 1. Direct role="list" within the section
    const roleList = section.querySelector("div[role='list']");
    if (roleList) {
      return { el: roleList, method: 'prepend' };
    }

    // 2. Carousel container inside the section
    const carousel = section.querySelector("g-scrolling-carousel");
    if (carousel) {
      const target = carousel.querySelector("div[role='list']") || carousel.firstElementChild || carousel;
      return { el: target, method: 'prepend' };
    }

    // 3. Existing provider items/links inside the section (exclude buttons in action rows)
    const providerLinks = section.querySelectorAll("a[href]:not([role='button'])");
    for (const link of providerLinks) {
      const parent = link.parentElement;
      if (parent && parent !== section && !parent.getAttribute('data-attrid') && parent.getAttribute('role') !== 'group') {
        return { el: parent, method: 'prepend' };
      }
    }

    // 4. If section has multiple child divs (Child 0 = "Where to watch" header, Child 1 = provider list)
    if (section.children.length > 1) {
      return { el: section.children[1], method: 'prepend' };
    }

    // 5. Append inside section directly (below header, never into firstElementChild)
    return { el: section, method: 'append' };
  }

  /**
   * Main injection logic into Google SERP.
   * Uses earlier placement only: injected directly into the "Where to Watch" list.
   * Zero interference with header action buttons (Stremio, Already watched, Want to watch).
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

    // Primary Target: "Where to Watch" Streaming Provider List (Earlier Placement)
    const existingCard = document.getElementById(NUVIO_CARD_ID);
    const target = findWatchProviderContainer();

    if (target && target.el) {
      if (!existingCard) {
        const card = createProviderCard(media);
        if (target.method === 'prepend' && target.el.firstChild) {
          target.el.insertBefore(card, target.el.firstChild);
        } else {
          target.el.appendChild(card);
        }
      }
      injectedInPanel = true;
    } else if (existingCard) {
      existingCard.remove();
    }

    // Fallback Target: Floating Action Pill (FAB)
    // Only displayed if Google Knowledge Panel does not offer a "Where to Watch" section
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
