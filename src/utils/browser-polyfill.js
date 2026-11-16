/**
 * Cross-browser compatibility wrapper for WebExtension APIs.
 * Supports Chrome, Brave, Opera, Edge, Firefox, and compatible browsers.
 */
(function (global) {
  'use strict';

  if (global.nuvioBrowser) {
    return;
  }

  const api = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  if (!api) {
    console.warn('[Nuvio] Neither chrome nor browser extension API found.');
    global.nuvioBrowser = {};
    return;
  }

  // Wrap callback-based APIs with Promises if running on older Chrome or where browser.* promises are not native
  const promisify = (fn, context) => {
    return (...args) => {
      return new Promise((resolve, reject) => {
        try {
          fn.call(context, ...args, (result) => {
            const err = api.runtime && api.runtime.lastError;
            if (err) {
              reject(new Error(err.message || String(err)));
            } else {
              resolve(result);
            }
          });
        } catch (e) {
          reject(e);
        }
      });
    };
  };

  const nuvioBrowser = {
    isFirefox: typeof browser !== 'undefined' && Boolean(browser.runtime && browser.runtime.getURL && browser.runtime.getURL('').startsWith('moz-extension://')),
    raw: api,

    storage: {
      sync: {
        get: (keys) => {
          if (api.storage && api.storage.sync && typeof api.storage.sync.get === 'function') {
            return new Promise((resolve) => {
              api.storage.sync.get(keys, (items) => {
                if (api.runtime && api.runtime.lastError) {
                  // Fall back to local storage if sync is unavailable
                  if (api.storage.local) {
                    api.storage.local.get(keys, resolve);
                  } else {
                    resolve({});
                  }
                } else {
                  resolve(items || {});
                }
              });
            });
          }
          return Promise.resolve({});
        },
        set: (items) => {
          if (api.storage && api.storage.sync && typeof api.storage.sync.set === 'function') {
            return new Promise((resolve, reject) => {
              api.storage.sync.set(items, () => {
                const err = api.runtime && api.runtime.lastError;
                if (err) {
                  if (api.storage.local) {
                    api.storage.local.set(items, () => resolve());
                  } else {
                    reject(new Error(err.message));
                  }
                } else {
                  resolve();
                }
              });
            });
          }
          return Promise.resolve();
        },
        remove: (keys) => {
          if (api.storage && api.storage.sync && typeof api.storage.sync.remove === 'function') {
            return promisify(api.storage.sync.remove, api.storage.sync)(keys);
          }
          return Promise.resolve();
        }
      },
      local: {
        get: (keys) => {
          if (api.storage && api.storage.local && typeof api.storage.local.get === 'function') {
            return promisify(api.storage.local.get, api.storage.local)(keys);
          }
          return Promise.resolve({});
        },
        set: (items) => {
          if (api.storage && api.storage.local && typeof api.storage.local.set === 'function') {
            return promisify(api.storage.local.set, api.storage.local)(items);
          }
          return Promise.resolve();
        }
      }
    },

    runtime: {
      getURL: (path) => {
        return api.runtime && typeof api.runtime.getURL === 'function' ? api.runtime.getURL(path) : path;
      },
      sendMessage: (message) => {
        if (api.runtime && typeof api.runtime.sendMessage === 'function') {
          return new Promise((resolve) => {
            api.runtime.sendMessage(message, (response) => {
              // Ignore lastError for unhandled messages
              resolve(response);
            });
          });
        }
        return Promise.resolve(null);
      },
      onMessage: api.runtime ? api.runtime.onMessage : null
    },

    tabs: {
      create: (createProperties) => {
        if (api.tabs && typeof api.tabs.create === 'function') {
          return promisify(api.tabs.create, api.tabs)(createProperties);
        }
        return Promise.resolve(null);
      }
    }
  };

  global.nuvioBrowser = nuvioBrowser;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this));
