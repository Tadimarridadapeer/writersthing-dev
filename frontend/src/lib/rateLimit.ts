interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const ipCache = new Map<string, RateLimitRecord>();

// Periodically clean up expired records to avoid memory leaks
if (typeof global !== 'undefined') {
  const globalObj = global as any;
  if (!globalObj.__rateLimitCleanupInterval) {
    globalObj.__rateLimitCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of ipCache.entries()) {
        if (now > record.resetTime) {
          ipCache.delete(ip);
        }
      }
    }, 5 * 60 * 1000); // every 5 minutes
  }
}

/**
 * Lightweight in-memory rate limiter for Next.js endpoints and middleware.
 * Returns true if request is within limits, false otherwise.
 */
export function rateLimiter(ip: string, options: RateLimiterOptions): {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  let record = ipCache.get(ip);

  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + options.windowMs,
    };
  }

  record.count += 1;
  ipCache.set(ip, record);

  const remaining = Math.max(0, options.max - record.count);
  const success = record.count <= options.max;

  return {
    success,
    limit: options.max,
    remaining,
    resetTime: record.resetTime,
  };
}
