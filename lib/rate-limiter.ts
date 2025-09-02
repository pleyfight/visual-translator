import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';
import { ApiError } from './api-middleware';

type RateLimiterOptions = {
  // A unique name for the rate limiter instance
  name: string;
  // Max number of requests allowed
  maxRequests: number;
  // Time window in milliseconds
  windowMs: number;
  // Storage backend (in-memory LRU cache by default)
  storage?: {
    get: (key: string) => number | undefined;
    set: (key: string, value: number, ttl: number) => void;
    increment: (key: string, ttl: number) => number;
  };
};

export class RateLimiter {
  private options: RateLimiterOptions;
  private store: RateLimiterOptions['storage'];

  constructor(options: RateLimiterOptions) {
    this.options = options;

    // Default to in-memory LRU cache if no storage is provided
    if (!options.storage) {
      const lruCache = new LRUCache<string, number>({
        max: 5000, // Max number of clients to track
        ttl: options.windowMs,
      });

      this.store = {
        get: (key) => lruCache.get(key),
        set: (key, value, ttl) => lruCache.set(key, value, { ttl }),
        increment: (key, ttl) => {
          const currentValue = lruCache.get(key) || 0;
          const newValue = currentValue + 1;
          lruCache.set(key, newValue, { ttl });
          return newValue;
        },
      };
    } else {
      this.store = options.storage;
    }
  }

  async check(identifier: string): Promise<{ limit: number; remaining: number; success: boolean }> {
    const count = this.store!.increment(identifier, this.options.windowMs);
    const remaining = this.options.maxRequests - count;
    const success = remaining >= 0;

    return {
      limit: this.options.maxRequests,
      remaining: success ? remaining : 0,
      success,
    };
  }
}

// Define different rate limiters for various parts of the API
export const rateLimiters = {
  api: new RateLimiter({ name: 'api', maxRequests: 100, windowMs: 15 * 60 * 1000 }),
  upload: new RateLimiter({ name: 'upload', maxRequests: 20, windowMs: 60 * 60 * 1000 }),
  translation: new RateLimiter({ name: 'translation', maxRequests: 50, windowMs: 60 * 60 * 1000 }),
};

// Middleware to apply the advanced rate limiter
export function withAdvancedRateLimit(
  limiter: RateLimiter,
  identifierFn: (req: NextRequest) => string | undefined
) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const identifier = identifierFn(request);
      if (!identifier) {
        // Cannot apply rate limit without an identifier
        return handler(request);
      }

      const { success, limit, remaining } = await limiter.check(identifier);

      if (!success) {
        throw new ApiError(429, 'Rate limit exceeded. Please try again later.', 'RATE_LIMIT_EXCEEDED');
      }

      const response = await handler(request);
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      return response;
    };
  };
}