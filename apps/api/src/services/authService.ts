import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { StudentSignupData, LecturerSignupData, SigninData, AuthUser } from "../types/auth";
import { USER_ROLES } from "../utils/constants";

export class AuthService {
  private generateToken(userId: number, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  }

  async signupStudent(data: StudentSignupData) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { studentNumber: data.studentNumber }],
      },
    });

    if (existingUser) {
      throw new Error("User with this email or student number already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        studentNumber: data.studentNumber,
        password: hashedPassword,
        role: USER_ROLES.STUDENT,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "student",
        studentNumber: user.studentNumber!,
      },
      token,
    };
  }

  async signupLecturer(data: LecturerSignupData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: USER_ROLES.LECTURER,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "lecturer",
      },
      token,
    };
  }

  async signin(data: SigninData) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "student" | "lecturer",
        studentNumber: user.studentNumber || undefined,
      },
      token,
    };
  }

  async validateToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "student" | "lecturer",
        studentNumber: user.studentNumber || undefined,
      };
    } catch {
      return null;
    }
  }
}

// Export both the class and an instance
export const authService = new AuthService();
