import { Router } from "express";
import { pollService } from "../../services/pollService";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { getSocketService } from "../../services/socketService";

const router = Router();

// Base lifecycle route
router.get("/lifecycle", (req, res) => {
  res.json({
    success: true,
    message: "Poll Lifecycle API",
    endpoints: {
      open: "POST /api/polls/:id/open (requires lecturer auth)",
      start: "POST /api/polls/:id/start (requires lecturer auth)",
      close: "POST /api/polls/:id/close (requires lecturer auth)",
    },
  });
});

// Open poll for joining (lobby phase)
router.post("/:id/open", authenticateToken, requireRole(["lecturer"]), async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const poll = await pollService.updatePollStatus(pollId, "open", req.user!.id);

    // Broadcast status change via WebSocket
    const socketService = getSocketService();
    socketService.broadcastPollStatusChange(poll.id, "open", poll);

    res.json({
      success: true,
      data: poll,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Start poll (make it live)
router.post("/:id/start", authenticateToken, requireRole(["lecturer"]), async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const poll = await pollService.updatePollStatus(pollId, "live", req.user!.id);

    // Broadcast status change via WebSocket
    const socketService = getSocketService();
    socketService.broadcastPollStatusChange(poll.id, "live", poll);

    res.json({
      success: true,
      data: poll,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Close/end poll
router.post("/:id/close", authenticateToken, requireRole(["lecturer"]), async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const poll = await pollService.updatePollStatus(pollId, "closed", req.user!.id);

    // Broadcast status change via WebSocket
    const socketService = getSocketService();
    socketService.broadcastPollStatusChange(poll.id, "closed", poll);

    res.json({
      success: true,
      data: poll,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
