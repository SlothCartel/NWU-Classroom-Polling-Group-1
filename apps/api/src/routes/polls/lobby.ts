import { Router } from "express";
import { participationService } from "../../services/participationService";
import { authenticateToken, requireRole } from "../../middleware/auth";

const router = Router();

// Base lobby route (info)
router.get("/lobby", (_req, res) => {
  res.json({
    success: true,
    message: "Poll Lobby API",
    endpoints: {
      getLobby: "GET /api/polls/:id/lobby (requires lecturer auth)",
      kickStudent: "DELETE /api/polls/:id/lobby/:studentNumber (requires lecturer auth)",
    },
  });
});

// Get current lobby (students who joined but haven't submitted yet)
router.get("/:id/lobby", authenticateToken, requireRole(["lecturer"]), async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const students = await participationService.getLobbyStudents(pollId);
    res.json({ success: true, data: students });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Kick a student from the lobby
router.delete(
  "/:id/lobby/:studentNumber",
  authenticateToken,
  requireRole(["lecturer"]),
  async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const { studentNumber } = req.params;

      const result = await participationService.kickStudentFromLobby(pollId, studentNumber);

      // If you later add sockets, you can notify here.

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

export default router;
