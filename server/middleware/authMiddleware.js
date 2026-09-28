import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';
export const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? '' : 'ayan-ai-jwt-dev-secret-local-only');

/**
 * Optional authentication middleware:
 * If an Authorization header with Bearer token is provided, decodes the token
 * and attaches user object to req.user. If absent or invalid, proceeds without error.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token || !JWT_SECRET) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Token is invalid/expired; continue unauthenticated
  }
  next();
}

/**
 * Required authentication middleware:
 * Rejects with 401 if valid token is missing.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing' });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Authentication service configuration error' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export default {
  optionalAuth,
  requireAuth,
};
