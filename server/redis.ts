import { createClient } from 'redis';

// Create Redis client with local configuration
const client = createClient({
  // Default Redis configuration for local development
  socket: {
    host: 'localhost',
    port: 6379,
  },
  // Disable retry on connection errors for development
  retry_strategy: () => null,
});

client.on('error', (err) => {
  console.warn('Redis Client Error (will fallback to in-memory):', err);
});

client.on('connect', () => {
  console.log('Redis Client Connected');
});

// Initialize Redis connection
let isRedisAvailable = false;

export const initRedis = async () => {
  try {
    await client.connect();
    isRedisAvailable = true;
    console.log('Redis initialized successfully');
  } catch (error) {
    console.warn('Redis not available, using in-memory fallback:', error);
    isRedisAvailable = false;
  }
};

// Cache service with fallback to in-memory
class CacheService {
  private memoryCache = new Map<string, { data: any; expires: number }>();

  async get(key: string): Promise<any> {
    if (isRedisAvailable) {
      try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.warn('Redis GET error, falling back to memory:', error);
      }
    }

    // Memory cache fallback
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
    if (isRedisAvailable) {
      try {
        await client.setEx(key, ttlSeconds, JSON.stringify(value));
        return;
      } catch (error) {
        console.warn('Redis SET error, falling back to memory:', error);
      }
    }

    // Memory cache fallback
    this.memoryCache.set(key, {
      data: value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  async del(key: string): Promise<void> {
    if (isRedisAvailable) {
      try {
        await client.del(key);
      } catch (error) {
        console.warn('Redis DEL error:', error);
      }
    }

    this.memoryCache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    if (isRedisAvailable) {
      try {
        return (await client.exists(key)) === 1;
      } catch (error) {
        console.warn('Redis EXISTS error:', error);
      }
    }

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

export { client as redisClient };