// Simple in-memory rate limiter (per IP) for small scale usage.
// Not production hardened (resets on restart). Token bucket-ish.

const buckets = new Map();

function rateLimit({ windowMs = 60000, max = 100 } = {}) {
  return function (req, res, next) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(ip);
    if (!bucket || now - bucket.start >= windowMs) {
      bucket = { start: now, count: 0 };
      buckets.set(ip, bucket);
    }
    bucket.count++;
    if (bucket.count > max) {
      const retrySec = Math.ceil((bucket.start + windowMs - now) / 1000);
      res.setHeader('Retry-After', String(retrySec));
      return res.status(429).json({ error: 'Rate limit exceeded', retryAfterSec: retrySec });
    }
    next();
  };
}

module.exports = { rateLimit };
