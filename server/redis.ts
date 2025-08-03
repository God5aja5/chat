// Simple in-memory cache service (no Redis dependency)
export const initRedis = async () => {
  console.log('Using in-memory cache service (Redis disabled)');
};

// Cache service with in-memory storage only
class CacheService {
  private memoryCache = new Map<string, { data: any; expires: number }>();

  async get(key: string): Promise<any> {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.memoryCache.delete(key);
    }
    return null;
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    this.memoryCache.set(key, {
      data: value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const cached = this.memoryCache.get(key);
    return cached !== undefined && cached.expires > Date.now();
  }

  // Clean up expired memory cache entries
  private cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();

// Clean up memory cache every 5 minutes
setInterval(() => {
  (cacheService as any).cleanupMemoryCache();
}, 5 * 60 * 1000);