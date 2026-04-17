import rateLimit from 'express-rate-limit'

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user?.userId) return `user:${req.user.userId}`
    return req.ip ?? 'unknown-ip'
  },
})
