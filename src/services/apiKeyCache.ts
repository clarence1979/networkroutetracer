// In-memory singleton — no window global, no cross-tab leakage.
// The OpenAI API key is user-supplied at runtime and lives only in
// sessionStorage (cleared when the tab closes) plus this module variable.

interface CacheStore {
  apiKey: string;
  listeners: Set<(apiKey: string) => void>;
}

const store: CacheStore = { apiKey: '', listeners: new Set() };

// Restore from sessionStorage on first load (clears automatically on tab close)
try {
  const saved = sessionStorage.getItem('globalApiKey');
  if (saved) store.apiKey = saved;
} catch (_) { /* storage unavailable */ }

// Wipe from sessionStorage on tab/window close
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try { sessionStorage.removeItem('globalApiKey'); } catch (_) { /* ignore */ }
  });
}

export const ApiKeyCache = {
  get apiKey(): string {
    return store.apiKey;
  },

  set apiKey(value: string) {
    store.apiKey = value;
    try {
      if (value) {
        sessionStorage.setItem('globalApiKey', value);
      } else {
        sessionStorage.removeItem('globalApiKey');
      }
    } catch (_) { /* storage unavailable */ }
    store.listeners.forEach(fn => {
      try { fn(value); } catch (_) { /* never let a listener crash the setter */ }
    });
  },

  subscribe(listener: (apiKey: string) => void): () => void {
    store.listeners.add(listener);
    listener(store.apiKey); // emit current value immediately
    return () => { store.listeners.delete(listener); };
  },

  clear() {
    this.apiKey = '';
  },

  hasApiKey(): boolean {
    return !!store.apiKey;
  },
};

// Convenience aliases used elsewhere in the codebase
export const cache       = ApiKeyCache;
export const globalApiKey = ApiKeyCache;
export const sharedApiKey = ApiKeyCache;
