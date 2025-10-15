import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload, AuthUser } from "../types/auth";
import { prisma } from "../config/database";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "student" | "lecturer",
      studentNumber: user.studentNumber || undefined,
    };

    next();
  } catch {
    return res.status(403).json({ success: false, error: "Invalid token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }
    next();
  };
};
