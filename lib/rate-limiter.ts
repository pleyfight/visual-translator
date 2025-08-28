import { z } from 'zod';

// Rate limiting configuration schema
const rateLimitConfigSchema = z.object({
  maxRequests: z.number().positive().default(100),
  windowMs: z.number().positive().default(15 * 60 * 1000), // 15 minutes
  message: z.string().default('Rate limit exceeded. Please try again later.'),
  keyGenerator: z.function().args(z.string()).returns(z.string()).optional(),
});

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;

// Rate limiting storage interface for different backends
export interface RateLimitStore {
  get(key: string): Promise<number | null>;
  set(key: string, value: number, ttlMs: number): Promise<void>;
  increment(key: string, ttlMs?: number): Promise<number>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// In-memory rate limit store (for development/single instance)
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { value: number; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: number, ttlMs: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async increment(key: string, ttlMs: number = 15 * 60 * 1000): Promise<number> {
    const current = await this.get(key);
    const newValue = (current || 0) + 1;
    await this.set(key, newValue, ttlMs);
    return newValue;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Redis rate limit store (for production/distributed systems)
export class RedisRateLimitStore implements RateLimitStore {
  private redis: any; // Redis client type would be imported in real implementation

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<number | null> {
    try {
      const value = await this.redis.get(key);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.error('Redis rate limit get error:', error);
      return null;
    }
  }

  async set(key: string, value: number, ttlMs: number): Promise<void> {
    try {
      await this.redis.setex(key, Math.ceil(ttlMs / 1000), value.toString());
    } catch (error) {
      console.error('Redis rate limit set error:', error);
      throw error;
    }
  }

  async increment(key: string, ttlMs: number = 15 * 60 * 1000): Promise<number> {
    try {
      const multi = this.redis.multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(ttlMs / 1000));
      const results = await multi.exec();
      return results[0][1]; // First command result (incr)
    } catch (error) {
      console.error('Redis rate limit increment error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis rate limit delete error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Redis rate limit clear error:', error);
      throw error;
    }
  }
}

// Main rate limiter class
export class RateLimiter {
  private store: RateLimitStore;
  private config: Required<RateLimitConfig>;

  constructor(store: RateLimitStore, config: Partial<RateLimitConfig> = {}) {
    this.store = store;
    this.config = {
      maxRequests: config.maxRequests || 100,
      windowMs: config.windowMs || 15 * 60 * 1000,
      message: config.message || 'Rate limit exceeded. Please try again later.',
      keyGenerator: config.keyGenerator || ((identifier: string) => `rate_limit:${identifier}`),
    };
  }

  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    count: number;
    remaining: number;
    resetTime: number;
    message?: string;
  }> {
    try {
      const key = this.config.keyGenerator(identifier);
      const count = await this.store.increment(key, this.config.windowMs);
      const remaining = Math.max(0, this.config.maxRequests - count);
      const resetTime = Date.now() + this.config.windowMs;

      return {
        allowed: count <= this.config.maxRequests,
        count,
        remaining,
        resetTime,
        message: count > this.config.maxRequests ? this.config.message : undefined,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        count: 0,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
      };
    }
  }

  async resetLimit(identifier: string): Promise<void> {
    const key = this.config.keyGenerator(identifier);
    await this.store.delete(key);
  }

  getConfig(): Required<RateLimitConfig> {
    return { ...this.config };
  }
}

// Factory function for creating rate limiters with different configurations
export function createRateLimiter(options: {
  store?: RateLimitStore;
  config?: Partial<RateLimitConfig>;
  useRedis?: boolean;
  redisClient?: any;
}): RateLimiter {
  let store: RateLimitStore;

  if (options.store) {
    store = options.store;
  } else if (options.useRedis && options.redisClient) {
    store = new RedisRateLimitStore(options.redisClient);
  } else {
    store = new MemoryRateLimitStore();
  }

  return new RateLimiter(store, options.config);
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // General API rate limiting
  api: createRateLimiter({
    config: {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
      message: 'API rate limit exceeded. Please try again in 15 minutes.',
    },
  }),

  // Upload rate limiting (more restrictive)
  upload: createRateLimiter({
    config: {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000, // 1 hour
      message: 'Upload rate limit exceeded. Please try again in 1 hour.',
    },
  }),

  // Translation job rate limiting
  translation: createRateLimiter({
    config: {
      maxRequests: 50,
      windowMs: 60 * 60 * 1000, // 1 hour
      message: 'Translation rate limit exceeded. Please try again in 1 hour.',
    },
  }),

  // Authentication rate limiting (very restrictive)
  auth: createRateLimiter({
    config: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  }),
};

// Middleware helper for Next.js API routes
export function withAdvancedRateLimit(
  rateLimiter: RateLimiter,
  identifierExtractor: (req: any) => string = (req) => req.user?.id || req.ip || 'anonymous'
) {
  return function (handler: (req: any) => Promise<any>) {
    return async (req: any) => {
      const identifier = identifierExtractor(req);
      const result = await rateLimiter.checkLimit(identifier);

      // Add rate limit headers
      const response = result.allowed 
        ? await handler(req)
        : new Response(JSON.stringify({ error: result.message }), { status: 429 });

      // Add rate limit headers to response
      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', rateLimiter.getConfig().maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
        response.headers.set('X-RateLimit-Window', (rateLimiter.getConfig().windowMs / 1000).toString());
      }

      return response;
    };
  };
}

export default RateLimiter;