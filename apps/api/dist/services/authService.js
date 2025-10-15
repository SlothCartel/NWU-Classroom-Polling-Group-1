"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const constants_1 = require("../utils/constants");
class AuthService {
    generateToken(userId, email, role) {
        return jsonwebtoken_1.default.sign({ userId, email, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    }
    async signupStudent(data) {
        // Check if user already exists
        const existingUser = await database_1.prisma.user.findFirst({
            where: {
                OR: [{ email: data.email }, { studentNumber: data.studentNumber }],
            },
        });
        if (existingUser) {
            throw new Error("User with this email or student number already exists");
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        // Create user
        const user = await database_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                studentNumber: data.studentNumber,
                password: hashedPassword,
                role: constants_1.USER_ROLES.STUDENT,
            },
        });
        const token = this.generateToken(user.id, user.email, user.role);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentNumber: user.studentNumber,
            },
            token,
        };
    }
    async signupLecturer(data) {
        // Check if user already exists
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new Error("User with this email already exists");
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        // Create user
        const user = await database_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: constants_1.USER_ROLES.LECTURER,
            },
        });
        const token = this.generateToken(user.id, user.email, user.role);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        };
    }
    async signin(data) {
        // Find user
        const user = await database_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw new Error("Invalid credentials");
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(data.password, user.password);
        if (!isValidPassword) {
            throw new Error("Invalid credentials");
        }
        const token = this.generateToken(user.id, user.email, user.role);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentNumber: user.studentNumber || undefined,
            },
            token,
        };
    }
    async validateToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await database_1.prisma.user.findUnique({
                where: { id: decoded.userId },
            });
            if (!user)
                return null;
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentNumber: user.studentNumber || undefined,
            };
        }
        catch {
            return null;
        }
    }
}
exports.AuthService = AuthService;
// Export both the class and an instance
exports.authService = new AuthService();
//# sourceMappingURL=authService.js.map