const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 300;
const buckets = new Map();

const rateLimiter = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, resetAt: now + WINDOW_MS };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + WINDOW_MS;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > MAX_REQUESTS) {
    res.status(429);
    next(new Error("Too many requests, please try again later"));
    return;
  }

  next();
};

const sanitizeValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.entries(value).reduce((clean, [key, nestedValue]) => {
      if (key.startsWith("$") || key.includes(".")) return clean;
      clean[key] = sanitizeValue(nestedValue);
      return clean;
    }, {});
  }
  if (typeof value === "string") return value.replace(/\0/g, "").trim();
  return value;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

module.exports = {
  rateLimiter,
  sanitizeRequest
};
