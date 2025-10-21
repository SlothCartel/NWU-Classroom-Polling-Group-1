import { Router, Request, Response } from "express";
import { authService } from "../../services/authService";
import { validateStudentSignup, validateSignin } from "../../middleware/validation";

const router = Router();

/**
 * @openapi
 * /api/auth/student:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Student auth endpoints info
 *     description: Returns available student authentication endpoints
 *     responses:
 *       200:
 *         description: List of available endpoints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Student Authentication API"
 *                 endpoints:
 *                   type: object
 */
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

/**
 * @openapi
 * /api/auth/student/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new student
 *     description: Creates a new student account and returns a JWT token valid for 7 days
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - studentNumber
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Doe"
 *                 description: Full name of the student
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane.doe@nwu.ac.za"
 *                 description: Valid email address (must be unique)
 *               studentNumber:
 *                 type: string
 *                 example: "12345678"
 *                 description: Student number (must be unique)
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "securePassword123"
 *                 description: Password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Student created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error, email or student number already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/auth/student/signin:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate student (signin)
 *     description: Authenticates a student and returns a JWT token valid for 7 days
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane.doe@nwu.ac.za"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securePassword123"
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/auth/student/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate student (login)
 *     description: Authenticates a student and returns a JWT token valid for 7 days. This is an alias for /signin endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane.doe@nwu.ac.za"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securePassword123"
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/auth/student/signout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Sign out student
 *     description: Signs out the current student. Note - JWT tokens are stateless, so this is primarily for client-side cleanup. Clients should remove the token from storage.
 *     responses:
 *       200:
 *         description: Successfully signed out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Signed out successfully"
 */
// Student signout (client-side token removal, but we can log it)
router.post("/signout", (req: Request, res: Response) => {
  // In a real app, you might want to blacklist the token
  res.json({
    success: true,
    message: "Signed out successfully",
  });
});

export default router;
