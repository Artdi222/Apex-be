import { Elysia } from 'elysia';

const cache = new Map<string, { count: number; expires: number }>();

export const rateLimit = (options: { max: number; windowMs: number }) => {
  return new Elysia().derive(({ request, set }) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const record = cache.get(ip);

    if (!record || now > record.expires) {
      cache.set(ip, { count: 1, expires: now + options.windowMs });
      return;
    }

    record.count++;
    if (record.count > options.max) {
      set.status = 429;
      set.headers['Retry-After'] = Math.ceil((record.expires - now) / 1000).toString();
      throw new Error('Too many requests, please try again later.');
    }
  });
};

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of cache.entries()) {
    if (now > record.expires) {
      cache.delete(ip);
    }
  }
}, 60000); // Every minute
