import { Request, Response, NextFunction } from "express";
import { AuthUser } from "../types/auth";
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => any;
//# sourceMappingURL=auth.d.ts.map