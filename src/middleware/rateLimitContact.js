// Simple in-memory rate limiter for contact endpoint
const contactAttempts = new Map();

const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // max requests per window

module.exports = function rateLimitContact(req, res, next) {
  const userId = req.user ? req.user._id.toString() : req.ip;
  const now = Date.now();
  
  if (!contactAttempts.has(userId)) {
    contactAttempts.set(userId, []);
  }
  
  const attempts = contactAttempts.get(userId);
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentAttempts.length >= MAX_REQUESTS) {
    return res.status(429).json({ 
      msg: 'Too many contact requests. Please try again later.',
      retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - recentAttempts[0])) / 1000)
    });
  }
  
  recentAttempts.push(now);
  contactAttempts.set(userId, recentAttempts);
  
  next();
};
