import { StudentSignupData, LecturerSignupData, SigninData, AuthUser } from "../types/auth";
export declare class AuthService {
    private generateToken;
    signupStudent(data: StudentSignupData): Promise<{
        user: {
            id: number;
            name: string;
            email: string;
            role: "student";
            studentNumber: string;
        };
        token: string;
    }>;
    signupLecturer(data: LecturerSignupData): Promise<{
        user: {
            id: number;
            name: string;
            email: string;
            role: "lecturer";
        };
        token: string;
    }>;
    signin(data: SigninData): Promise<{
        user: {
            id: number;
            name: string;
            email: string;
            role: "student" | "lecturer";
            studentNumber: string;
        };
        token: string;
    }>;
    validateToken(token: string): Promise<AuthUser | null>;
}
export declare const authService: AuthService;
//# sourceMappingURL=authService.d.ts.map