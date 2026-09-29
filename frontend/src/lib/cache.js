/**
 * Two-tier frontend cache to reduce Firebase read operations
 * Tier 1: In-memory (survives re-renders, cleared on page reload)
 * Tier 2: localStorage (survives page reload, has TTL)
 */
const CACHE_VERSION = "v2";
const memStore = new Map();

export const memCache = {
  get(key) {
    const entry = memStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) { memStore.delete(key); return null; }
    return entry.data;
  },
  set(key, data, ttlMs = 2 * 60 * 1000) {
    memStore.set(key, { data, expiry: Date.now() + ttlMs });
  },
  invalidate(key) { memStore.delete(key); }
};

export const lsCache = {
  get(key) {
    try {
      const raw = localStorage.getItem("pd_cache_" + CACHE_VERSION + "_" + key);
      if (!raw) return null;
      const { data, expiry } = JSON.parse(raw);
      if (Date.now() > expiry) { localStorage.removeItem("pd_cache_" + CACHE_VERSION + "_" + key); return null; }
      return data;
    } catch { return null; }
  },
  set(key, data, ttlMs = 5 * 60 * 1000) {
    try {
      localStorage.setItem("pd_cache_" + CACHE_VERSION + "_" + key, JSON.stringify({ data, expiry: Date.now() + ttlMs }));
    } catch {
      try { Object.keys(localStorage).filter(k => k.startsWith("pd_cache_")).forEach(k => localStorage.removeItem(k)); } catch {}
    }
  },
  invalidate(key) { try { localStorage.removeItem("pd_cache_" + CACHE_VERSION + "_" + key); } catch {} },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith("pd_cache_")).forEach(k => localStorage.removeItem(k)); } catch {} }
};

/**
 * Smart cached fetch: mem cache -> ls cache -> network
 * @param {string} url 
 * @param {object} options - fetch options
 * @param {number} ttlMs - cache TTL in ms
 * @param {string} cacheKey - optional custom key
 */
export async function cachedFetch(url, options = {}, ttlMs = 5 * 60 * 1000, cacheKey = null) {
  const key = cacheKey || url;
  const memHit = memCache.get(key);
  if (memHit) return memHit;
  const lsHit = lsCache.get(key);
  if (lsHit) { memCache.set(key, lsHit, Math.min(ttlMs, 2 * 60 * 1000)); return lsHit; }
  const res = await fetch(url, options);
  if (!res.ok) throw new Error("Fetch failed: " + res.status);
  const data = await res.json();
  lsCache.set(key, data, ttlMs);
  memCache.set(key, data, Math.min(ttlMs, 2 * 60 * 1000));
  return data;
}
