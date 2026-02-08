import { verifyToken as verifyJWT } from '../utils/jwt.js';
import { sendResponse } from '../utils/response.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Verify JWT token middleware
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendResponse(res, 401, false, 'No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = verifyJWT(token);

    if (!decoded) {
      return sendResponse(res, 401, false, 'Invalid or expired token');
    }

    // Check if user is blocked
    const [user] = await db
      .select({ isBlocked: users.isBlocked })
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (user && user.isBlocked) {
      return sendResponse(res, 403, false, 'Account has been blocked. Please contact support.');
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return sendResponse(res, 401, false, 'Authentication failed');
  }
};

// Require specific role(s) middleware
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return sendResponse(res, 401, false, 'Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        return sendResponse(
          res,
          403,
          false,
          'Access denied. Insufficient permissions'
        );
      }

      next();
    } catch (error) {
      console.error('Role Middleware Error:', error);
      return sendResponse(res, 403, false, 'Authorization failed');
    }
  };
};
