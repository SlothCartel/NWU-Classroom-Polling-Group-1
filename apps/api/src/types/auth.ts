export interface StudentSignupData {
  name: string;
  email: string;
  studentNumber: string;
  password: string;
}

export interface LecturerSignupData {
  name: string;
  email: string;
  password: string;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "student" | "lecturer";
  studentNumber?: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}
