import { Router } from "express";
import { participationService } from "../../services/participationService";
import { authenticateToken, requireRole } from "../../middleware/auth";
// import { getSocketService } from '../../services/socketService';

const router = Router();

// Base lobby route
router.get("/lobby", (req, res) => {
  res.json({
    success: true,
    message: "Poll Lobby API",
    endpoints: {
      getLobby: "GET /api/polls/:id/lobby (requires lecturer auth)",
      kickStudent: "DELETE /api/polls/:id/lobby/:studentNumber (requires lecturer auth)",
    },
  });
});

// Get students in lobby
router.get("/:id/lobby", authenticateToken, requireRole(["lecturer"]), async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const students = await participationService.getLobbyStudents(pollId);

    res.json({
      success: true,
      data: students,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Kick student from lobby
router.delete(
  "/:id/lobby/:studentNumber",
  authenticateToken,
  requireRole(["lecturer"]),
  async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const { studentNumber } = req.params;

      const result = await participationService.kickStudentFromLobby(pollId, studentNumber);

      // Notify student via WebSocket (commented out until fully implemented)
      // const socketService = getSocketService();
      // socketService.notifyUserKicked(pollId.toString(), userId);

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
  },
);

export default router;
