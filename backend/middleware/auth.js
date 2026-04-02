import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Attach user ID to the request object
      req.user = { id: decoded.id };
      
      return next();
    } catch (error) {
      console.error('[AUTH] Token verification failed:', error.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  // Graceful fallback during transition: if frontend hasn't updated its token yet
  // but passed a userId in body or query, we allow it (simulate old behavior)
  // Remove this fallback section once strict JWT enforcement is desired.
  const fallbackId = req.body.userId || req.query.userId || req.headers['x-user-id'];
  if (fallbackId) {
    req.user = { id: fallbackId };
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token available' });
  }
};
