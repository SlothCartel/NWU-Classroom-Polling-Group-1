import { Router } from "express";
import studentRoutes from "./student";
import lecturerRoutes from "./lecturer";

const router = Router();

/**
 * @openapi
 * /api/auth:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Auth endpoints info
 *     description: Returns available authentication endpoints for both students and lecturers
 *     responses:
 *       200:
 *         description: List of authentication endpoints
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
 *                   example: "Authentication API"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     lecturer:
 *                       type: object
 *                     student:
 *                       type: object
 */
// Base auth route - shows available auth endpoints
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Authentication API",
    endpoints: {
      lecturer: {
        signup: "POST /api/auth/lecturer/signup",
        login: "POST /api/auth/lecturer/login",
      },
      student: {
        signup: "POST /api/auth/student/signup",
        login: "POST /api/auth/student/login",
      },
    },
  });
});

// Mount student auth routes
router.use("/student", studentRoutes);

// Mount lecturer auth routes
router.use("/lecturer", lecturerRoutes);

export default router;
