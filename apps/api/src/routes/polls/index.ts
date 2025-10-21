import { Router } from "express";
import crudRoutes from "./crud";
import lifecycleRoutes from "./lifecycle";
import participationRoutes from "./participation";
import lobbyRoutes from "./lobby";
import analyticsRoutes from "./analytics";

const router = Router();

/**
 * @openapi
 * /api/polls/info:
 *   get:
 *     tags:
 *       - Poll Management
 *     summary: Polls API endpoints info
 *     description: Returns an overview of all available poll-related endpoints organized by category
 *     responses:
 *       200:
 *         description: List of all poll endpoints
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
 *                   example: "Polls API"
 *                 endpoints:
 *                   type: object
 *                   description: Categorized list of all poll endpoints
 */
// Base polls route - shows available endpoints (for testing)
router.get("/info", (req, res) => {
  res.json({
    success: true,
    message: "Polls API",
    endpoints: {
      polls: {
        list: "GET /api/polls (requires lecturer auth)",
        get: "GET /api/polls/:id (requires auth)",
        create: "POST /api/polls (requires lecturer auth)",
        update: "PUT /api/polls/:id (requires lecturer auth)",
        delete: "DELETE /api/polls/:id (requires lecturer auth)",
      },
      lifecycle: {
        open: "POST /api/polls/:id/open",
        start: "POST /api/polls/:id/start",
        close: "POST /api/polls/:id/close",
      },
      participation: {
        join: "POST /api/polls/join/:code",
        submit: "POST /api/polls/:id/submit",
      },
      lobby: {
        status: "GET /api/polls/:id/lobby",
        participants: "GET /api/polls/:id/participants",
      },
      analytics: {
        results: "GET /api/polls/:id/results",
        export: "GET /api/polls/:id/export",
      },
    },
  });
});

// Mount specific routes BEFORE general CRUD routes
// Order matters! More specific routes must come before general ones
router.use("/", participationRoutes); // Student participation (includes /join, /code/:joinCode)
router.use("/", lifecycleRoutes); // Poll lifecycle (includes /lifecycle base route)
router.use("/", lobbyRoutes); // Lobby management (includes /lobby base route)
router.use("/", analyticsRoutes); // Statistics and export (includes /analytics base route)
router.use("/", crudRoutes); // Basic CRUD operations (includes /, /:id - must be last)

export default router;
