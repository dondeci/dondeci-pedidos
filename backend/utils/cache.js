// Simple in-memory cache with TTL
const cache = new Map();

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in milliseconds (default: 60 seconds)
 * @returns {any|null} Cached value or null if expired/not found
 */
export const getFromCache = (key, ttl = 60000) => {
    const item = cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > ttl) {
        cache.delete(key);
        return null;
    }

    return item.data;
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export const setCache = (key, data) => {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
};

/**
 * Clear cache by pattern or all
 * @param {string} pattern - Pattern to match (optional)
 */
export const clearCache = (pattern = null) => {
    if (!pattern) {
        cache.clear();
        return;
    }

    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    }
};

/**
 * Get cache stats
 */
export const getCacheStats = () => {
    return {
        size: cache.size,
        keys: Array.from(cache.keys())
    };
};
