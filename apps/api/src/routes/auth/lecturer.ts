import { Router, Request, Response } from "express";
import { authService } from "../../services/authService";
import { validateLecturerSignup, validateSignin } from "../../middleware/validation";

const router = Router();

/**
 * @openapi
 * /api/auth/lecturer:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Lecturer auth endpoints info
 *     description: Returns available lecturer authentication endpoints
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
 *                   example: "Lecturer Authentication API"
 *                 endpoints:
 *                   type: object
 */
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

/**
 * @openapi
 * /api/auth/lecturer/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new lecturer
 *     description: Creates a new lecturer account and returns a JWT token valid for 7 days
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dr. John Smith"
 *                 description: Full name of the lecturer
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.smith@nwu.ac.za"
 *                 description: Valid email address (must be unique)
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "securePassword123"
 *                 description: Password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Lecturer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/auth/lecturer/signin:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate lecturer (signin)
 *     description: Authenticates a lecturer and returns a JWT token valid for 7 days
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
 *                 example: "john.smith@nwu.ac.za"
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

/**
 * @openapi
 * /api/auth/lecturer/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate lecturer (login)
 *     description: Authenticates a lecturer and returns a JWT token valid for 7 days. This is an alias for /signin endpoint.
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
 *                 example: "john.smith@nwu.ac.za"
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

/**
 * @openapi
 * /api/auth/lecturer/signout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Sign out lecturer
 *     description: Signs out the current lecturer. Note - JWT tokens are stateless, so this is primarily for client-side cleanup. Clients should remove the token from storage.
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
// Lecturer signout
router.post("/signout", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Signed out successfully",
  });
});

export default router;
