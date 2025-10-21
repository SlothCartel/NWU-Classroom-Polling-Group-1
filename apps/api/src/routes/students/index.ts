import { Router } from "express";
import submissionsRoutes from "./submissions";

const router = Router();

/**
 * @openapi
 * /api/students:
 *   get:
 *     tags:
 *       - Student Submissions
 *     summary: Students API endpoints info
 *     description: Returns available student-related endpoints
 *     responses:
 *       200:
 *         description: List of student endpoints
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
 *                   example: "Students API"
 *                 endpoints:
 *                   type: object
 */
// Base students route - shows available endpoints
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Students API",
    endpoints: {
      submissions: {
        get: "GET /api/students/:studentNumber/submissions",
        delete: "DELETE /api/students/:studentNumber/submissions/:pollId",
      },
    },
  });
});

// Mount submissions routes
router.use("/", submissionsRoutes);

export default router;
