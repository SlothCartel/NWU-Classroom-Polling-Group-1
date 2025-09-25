import { Router } from "express";
import { analyticsService } from "../../services/analyticsService";
import { authenticateToken, requireRole } from "../../middleware/auth";

const router = Router();

// Base analytics route
router.get("/analytics", (req, res) => {
  res.json({
    success: true,
    message: "Poll Analytics API",
    endpoints: {
      stats: "GET /api/polls/:id/stats (requires lecturer auth)",
      export: "GET /api/polls/:id/export (requires lecturer auth)",
    },
  });
});

// Get real-time poll statistics
router.get("/:id/stats", authenticateToken, requireRole(["lecturer"]), async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const stats = await analyticsService.getPollStats(pollId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Export poll results
router.get("/:id/export", authenticateToken, requireRole(["lecturer"]), async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const format = (req.query.format as string) || "json";

    const data = await analyticsService.exportPollData(pollId, format as "json" | "csv");

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=poll_${pollId}_results.csv`);
      // You'd need to implement CSV formatting here
      res.send("CSV export not fully implemented yet");
    } else {
      res.json({
        success: true,
        data,
      });
    }
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
