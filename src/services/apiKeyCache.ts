// Global API Key Cache Service
interface ApiKeyCache {
  apiKey: string;
  listeners: Set<(apiKey: string) => void>;
}

// Create global cache object
const createGlobalCache = (): ApiKeyCache => ({
  apiKey: '',
  listeners: new Set()
});

// Initialize global cache
let globalApiKeyCache: ApiKeyCache;

// Initialize cache and attach to window
const initializeCache = () => {
  if (typeof window !== 'undefined') {
    // Create cache if it doesn't exist
    if (!window.apiKeyCache) {
      globalApiKeyCache = createGlobalCache();
      window.apiKeyCache = globalApiKeyCache;
      
      // Try to load from sessionStorage (clears on tab close)
      try {
        const cachedKey = sessionStorage.getItem('globalApiKey');
        if (cachedKey) {
          globalApiKeyCache.apiKey = cachedKey;
        }
      } catch (error) {
        console.warn('Failed to load API key from session storage:', error);
      }
      
      // Clear cache when page/tab closes
      window.addEventListener('beforeunload', () => {
        try {
          sessionStorage.removeItem('globalApiKey');
        } catch (error) {
          console.warn('Failed to clear API key cache:', error);
        }
      });
    } else {
      globalApiKeyCache = window.apiKeyCache;
    }
  } else {
    // Fallback for non-browser environments
    globalApiKeyCache = createGlobalCache();
  }
};

// Initialize on module load
initializeCache();

export const ApiKeyCache = {
  // Get current API key
  get apiKey(): string {
    return globalApiKeyCache?.apiKey || '';
  },

  // Set API key and notify all listeners
  set apiKey(value: string) {
    if (globalApiKeyCache) {
      globalApiKeyCache.apiKey = value;
      
      // Save to sessionStorage (auto-clears on tab close)
      try {
        if (value) {
          sessionStorage.setItem('globalApiKey', value);
        } else {
          sessionStorage.removeItem('globalApiKey');
        }
      } catch (error) {
        console.warn('Failed to save API key to session storage:', error);
      }
      
      // Notify all listeners
      globalApiKeyCache.listeners.forEach(listener => {
        try {
          listener(value);
        } catch (error) {
          console.warn('Error notifying API key listener:', error);
        }
      });
      
    }
  },

  // Subscribe to API key changes
  subscribe(listener: (apiKey: string) => void): () => void {
    if (globalApiKeyCache) {
      globalApiKeyCache.listeners.add(listener);
      
      // Immediately call with current value
      listener(globalApiKeyCache.apiKey);
      
      // Return unsubscribe function
      return () => {
        globalApiKeyCache.listeners.delete(listener);
      };
    }
    
    return () => {}; // No-op unsubscribe for fallback
  },

  // Clear the cache
  clear(): void {
    this.apiKey = '';
  },

  // Check if API key exists
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    apiKeyCache: ApiKeyCache;
  }
}

// Export for direct access (cache.apiKey)
export const cache = {
  get apiKey(): string {
    return ApiKeyCache.apiKey;
  },
  
  set apiKey(value: string) {
    ApiKeyCache.apiKey = value;
  }
};

// Also export as globalApiKey and sharedApiKey for convenience
export const globalApiKey = ApiKeyCache;
export const sharedApiKey = ApiKeyCache;