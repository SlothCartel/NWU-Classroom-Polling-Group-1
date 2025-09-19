import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Validate required environment variables
if (!process.env.JWT_SECRET && NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}

if (!DATABASE_URL) {
  console.warn('DATABASE_URL not set, using default Prisma configuration');
}
