import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken, toSafeUser } from '../utils/auth';
import { AuthenticatedRequest, SafeUser } from '../types/auth';

// Instantiate PrismaClient once and export for reuse
export const prisma = new PrismaClient();

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header is required',
        },
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Token must be provided in Bearer format',
        },
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token) as { userId: number } | null;
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
      return;
    }

    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User no longer exists',
        },
      });
      return;
    }

    // Add user to request (map DB user -> SafeUser)
    req.user = toSafeUser(user as any);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Internal authentication error',
      },
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user to request if token is provided and valid
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      next();
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token) as { userId: number } | null;
    if (!decoded) {
      next();
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    // If you add is_active to your schema, uncomment below:
    // if (user && user.is_active) {
    //   req.user = toSafeUser(user);
    // }
    if (user) {
      req.user = toSafeUser(user);
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue without authentication on error
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access this resource',
        },
      });
      return;
    }

    next();
  };
};

/**
 * Admin authorization middleware
 */
export const requireAdmin = authorize(['ADMIN']);

/**
 * Moderator or Admin authorization middleware
 */
export const requireModerator = authorize(['ADMIN', 'MODERATOR']);

/**
 * Email verification middleware
 * If you add email_verified to your schema, use it here.
 */
export const requireVerifiedEmail = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required',
      },
    });
    return;
  }

  // If you add email_verified to your schema, uncomment below:
  // if (!req.user.email_verified) {
  //   res.status(403).json({
  //     success: false,
  //     error: {
  //       code: 'EMAIL_NOT_VERIFIED',
  //       message: 'Email verification is required',
  //     },
  //   });
  //   return;
  // }

  next();
};

/**
 * Rate limiting middleware for authentication endpoints
 * NOTE: For production, use a distributed store like Redis.
 */
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    // Improved IP extraction (supports proxies)
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean up expired entries
    for (const [ip, data] of attempts.entries()) {
      if (now > data.resetTime) {
        attempts.delete(ip);
      }
    }

    const clientAttempts = attempts.get(clientIp);

    if (clientAttempts && clientAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((clientAttempts.resetTime - now) / 1000 / 60);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many attempts. Try again in ${timeLeft} minutes`,
        },
      });
      return;
    }

    // Record this attempt
    if (clientAttempts) {
      clientAttempts.count++;
    } else {
      attempts.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns a resource
 * NOTE: Ownership logic should be implemented in controllers for each resource type.
 */
export const requireOwnership = (resourceField: string = 'created_by') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
        },
      });
      return;
    }

    // Admin can access any resource
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    // Check ownership - implement logic in controllers for each resource type
    next();
  };
};
