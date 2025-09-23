import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma, authenticate } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * NOTE:
 * Your current Prisma schema does NOT include a password column for User.
 * Local register/login that hash and store passwords will fail unless you
 * update the DB schema. To avoid runtime schema errors we return 501 here
 * and suggest using SAML (controllers/authController.ts) or updating Prisma.
 */

/* Local register (disabled until schema supports password storage) */
router.post('/register', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'LOCAL_AUTH_UNSUPPORTED',
      message:
        'Local registration is not supported because the User model has no password field. Use SAML or update the Prisma schema to add password storage.',
    },
  });
});

/* Local login (disabled until schema supports password storage) */
router.post('/login', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'LOCAL_AUTH_UNSUPPORTED',
      message:
        'Local login is not supported because the User model has no password field. Use SAML or update the Prisma schema to add password storage.',
    },
  });
});

/*
 * SAML endpoints - delegate to your auth controller (implement these in controllers/authController.ts)
 * Example (controller functions may differ): 
 *   router.get('/saml/login', authController.initiateSamlLogin);
 *   router.post('/saml/callback', authController.handleSamlCallback);
 *
 * If you don't have an authController yet, these are placeholders.
 */
router.get('/saml/login', (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'SAML_NOT_IMPLEMENTED',
      message: 'SAML login endpoint not implemented. Implement controllers/authController.ts and wire it here.',
    },
  });
});

router.post('/saml/callback', (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'SAML_NOT_IMPLEMENTED',
      message: 'SAML callback endpoint not implemented. Implement controllers/authController.ts and wire it here.',
    },
  });
});

/**
 * Get current user
 */
router.get('/me', authenticate, async (req: any, res: Response) => {
  // authenticate middleware sets req.user via toSafeUser
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required' } });
    return;
  }
  res.json({ success: true, data: { user: req.user } });
});

export default router;
