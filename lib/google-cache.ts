// lib/google-cache.ts

const CACHE_PREFIX = "fg-place-";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface CachedPlaceData {
  // Basic info
  name: string;
  address: string;
  phone?: string;

  // Location
  coordinates: [number, number]; // [lat, lng]
  country: string;
  countryCode: string;
  city: string;

  // Ratings & Reviews
  rating?: number;
  totalReviews?: number;
  description?: string; // First review text

  // Media & Links
  images: string[];
  website?: string; // Restaurant's own website
  googleMapsUri?: string; // Google Maps link

  // Business info
  priceLevel?: number; // 0-4 scale
  openingHours?: string[]; // Weekday descriptions
  types?: string[]; // Google place types (used as tags)

  // Cache metadata
  cachedAt: number;
  expiresAt: number;
}

/**
 * Get cached place data from localStorage
 * Returns null if not found or expired
 */

export const getCachedPlaceData = (placeId: string): CachedPlaceData | null => {
  if (typeof window === "undefined") return null;

  try {
    const key = `${CACHE_PREFIX}${placeId}`;
    const cachedData = localStorage.getItem(key);

    if (!cachedData) return null;

    const data: CachedPlaceData = JSON.parse(cachedData);

    // Check if expired
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(key);
      console.log(`🗑️ Cache expired for ${placeId}`);
      return null;
    }

    console.log(`📦 Cache HIT for ${placeId}`);
    return data;
  } catch {
    return null;
  }
};

/**
 * Save place data to localStorage cache
 */

export function setCachedPlace(
  placeId: string,
  data: Omit<CachedPlaceData, "cachedAt" | "expiresAt">
): void {
  if (typeof window === "undefined") return;

  try {
    const key = `${CACHE_PREFIX}${placeId}`;
    const now = Date.now();

    const cacheEntry: CachedPlaceData = {
      ...data,
      cachedAt: now,
      expiresAt: now + CACHE_TTL,
    };

    localStorage.setItem(key, JSON.stringify(cacheEntry));
    console.log(`💾 Cached place ${placeId}`);
  } catch (error) {
    // localStorage might be full or unavailable
    console.warn("Failed to cache place data:", error);
  }
}

/**
 * Remove all expired cache entries
 * Call this on app startup
 */
export function clearExpiredCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(CACHE_PREFIX)
    );
    const now = Date.now();
    let cleared = 0;

    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        if (data.expiresAt && now > data.expiresAt) {
          localStorage.removeItem(key);
          cleared++;
        }
      } catch {
        // Corrupted entry, remove it
        localStorage.removeItem(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }
  } catch {
    // Fail silently
  }
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): { count: number; sizeKB: number } {
  if (typeof window === "undefined") return { count: 0, sizeKB: 0 };

  const keys = Object.keys(localStorage).filter((k) =>
    k.startsWith(CACHE_PREFIX)
  );
  let totalSize = 0;

  for (const key of keys) {
    totalSize += (localStorage.getItem(key) || "").length * 2; // UTF-16 = 2 bytes per char
  }

  return {
    count: keys.length,
    sizeKB: Math.round(totalSize / 1024),
  };
}
