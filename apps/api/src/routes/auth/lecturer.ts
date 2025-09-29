import { Router, Request, Response } from "express";
import { authService } from "../../services/authService";
import { validateLecturerSignup, validateSignin } from "../../middleware/validation";

const router = Router();

// Base lecturer auth route
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Lecturer Authentication API",
    endpoints: {
      signup: "POST /api/auth/lecturer/signup",
      login: "POST /api/auth/lecturer/login",
      signin: "POST /api/auth/lecturer/signin",
      signout: "POST /api/auth/lecturer/signout",
    },
  });
});

// Lecturer signup
router.post("/signup", validateLecturerSignup, async (req: Request, res: Response) => {
  try {
    const result = await authService.signupLecturer(req.body);
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

// Lecturer signin
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

// Lecturer login (alias for signin)
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

// Lecturer signout
router.post("/signout", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Signed out successfully",
  });
});

export default router;
