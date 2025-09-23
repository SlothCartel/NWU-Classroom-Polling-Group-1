import jwt from 'jsonwebtoken';
import { SafeUser } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

/**
 * Sign a JWT access token containing { userId }
 */
export function signAccessToken(payload: { userId: number }, expiresIn: string = '1h'): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify JWT and return payload { userId } or null on failure
 */
export function verifyAccessToken(token: string): { userId: number } | null {
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		// jwt.verify can return string or object
		if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
			const userId = (decoded as any).userId;
			if (typeof userId === 'number') {
				return { userId };
			}
			// if userId is string, attempt to coerce
			if (typeof userId === 'string' && /^\d+$/.test(userId)) {
				return { userId: parseInt(userId, 10) };
			}
		}
		return null;
	} catch (err) {
		// token invalid or expired
		return null;
	}
}

/**
 * Parse "Bearer <token>" header value
 */
export function parseBearerToken(authHeader?: string | string[] | undefined): string | null {
	if (!authHeader) return null;
	const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
	if (!header) return null;
	return header.startsWith('Bearer ') ? header.slice(7) : header;
}

/**
 * Map a DB user record to SafeUser (exclude sensitive fields)
 * Adjust mapping if your Prisma model uses different field names.
 */
export function toSafeUser(user: any): SafeUser {
	// Accept either camelCase or snake_case created_at
	const createdAt = user.created_at ?? user.createdAt;
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		created_at: createdAt ? new Date(createdAt) : new Date(),
	};
}