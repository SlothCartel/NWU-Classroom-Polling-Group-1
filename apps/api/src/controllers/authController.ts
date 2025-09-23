/**import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * Placeholder to start SAML login flow.
 * If you integrate a real SAML provider (passport-saml or similar),
 * replace this with a redirect to the provider's login URL.
 */
/**export const initiateSamlLogin = async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'SAML_INIT_NOT_IMPLEMENTED',
      message:
        'SAML initiation not implemented on the server. Implement a redirect to your IdP or use the POST callback below to create/lookup users.',
      hint:
        'To mock a SAML callback for now, POST JSON to /api/auth/saml/callback with { email, name, role? }',
    },
  });
};

/**
 * Handle SAML callback (or a POST from an IdP) that contains user profile info.
 * Accepts JSON body: { email: string, name?: string, role?: string }
 *
 * Behavior:
 * - Validates email present
 * - Finds existing user by email or creates a new one
 * - Issues a JWT { userId }
 * - Returns safe user (no sensitive fields) and token
 *
 * NOTE: This is a simple generic handler to integrate with an IdP that posts profile info.
 * If you use passport-saml, you would instead read profile from req.user.
 *
export const handleSamlCallback = async (req: Request, res: Response, _next?: NextFunction) => {
  try {
    // Accept either req.body.profile (passport style) or raw body
    const body = (req as any).body || {};
    const profile = body.profile || body;

    const email = (profile && profile.email) || profile?.mail || profile?.username;
    const name = profile?.name || profile?.displayName || profile?.fullName || 'Unknown';
    const role = profile?.role || 'USER';

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_EMAIL', message: 'SAML profile must include email' },
      });
      return;
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          role: role.toString(),
          // created_at will be set by Prisma default
        } as any,
      });
    } else {
      // Optionally update name/role if changed
      const updates: any = {};
      if (name && user.name !== name) updates.name = name;
      if (role && user.role !== role) updates.role = role;
      if (Object.keys(updates).length) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };

    res.json({ success: true, data: { user: safeUser, token } });
  } catch (err) {
    console.error('SAML callback error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SAML_CALLBACK_ERROR', message: 'Failed to process SAML callback' },
    });
  }
};

export default {
  initiateSamlLogin,
  handleSamlCallback,
}; 
*/
