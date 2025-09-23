import { Request } from 'express';

export type SafeUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: Date;
};

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}
