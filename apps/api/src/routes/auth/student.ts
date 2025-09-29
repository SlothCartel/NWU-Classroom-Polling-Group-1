import { Router, Request, Response } from "express";
import { authService } from "../../services/authService";
import { validateStudentSignup, validateSignin } from "../../middleware/validation";

const router = Router();

// Base student auth route
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Student Authentication API",
    endpoints: {
      signup: "POST /api/auth/student/signup",
      login: "POST /api/auth/student/login",
      signin: "POST /api/auth/student/signin",
      signout: "POST /api/auth/student/signout",
    },
  });
});

// Student signup
router.post("/signup", validateStudentSignup, async (req: Request, res: Response) => {
  try {
    const result = await authService.signupStudent(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Student signin
router.post("/signin", validateSignin, async (req: Request, res: Response) => {
  try {
    const result = await authService.signin(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Student login (alias for signin)
router.post("/login", validateSignin, async (req: Request, res: Response) => {
  try {
    const result = await authService.signin(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Student signout (client-side token removal, but we can log it)
router.post("/signout", (req: Request, res: Response) => {
  // In a real app, you might want to blacklist the token
  res.json({
    success: true,
    message: "Signed out successfully",
  });
});

export default router;
