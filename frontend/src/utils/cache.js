// Cache utility with auto-invalidation on version change
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const CACHE_PREFIX = `cache_v${APP_VERSION}_`;

/**
 * Get from localStorage cache with version check
 * @param {string} key - Cache key
 * @param {number} maxAge - Max age in milliseconds (default: 5 minutes)
 * @returns {any|null}
 */
export const cacheGet = (key, maxAge = 300000) => {
    try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const item = localStorage.getItem(cacheKey);
        if (!item) return null;

        const { data, timestamp, version } = JSON.parse(item);

        // Invalidate if version mismatch
        if (version !== APP_VERSION) {
            localStorage.removeItem(cacheKey);
            return null;
        }

        // Invalidate if expired
        if (Date.now() - timestamp > maxAge) {
            localStorage.removeItem(cacheKey);
            return null;
        }

        return data;
    } catch (e) {
        console.warn('Cache get error:', e);
        return null;
    }
};

/**
 * Set in localStorage cache with version
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export const cacheSet = (key, data) => {
    try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now(),
            version: APP_VERSION
        }));
    } catch (e) {
        console.warn('Cache set error:', e);
    }
};

/**
 * Clear all caches (including old versions)
 */
export const cacheClearAll = () => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('✅ Cache cleared');
    } catch (e) {
        console.warn('Cache clear error:', e);
    }
};

/**
 * Clear specific cache key
 */
export const cacheClear = (key) => {
    try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        localStorage.removeItem(cacheKey);
    } catch (e) {
        console.warn('Cache clear error:', e);
    }
};

/**
 * Get cache stats for debugging
 */
export const getCacheInfo = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
    return {
        version: APP_VERSION,
        count: keys.length,
        keys: keys,
        size: JSON.stringify(localStorage).length
    };
};
