import { Router } from "express";
import { analyticsService } from "../../services/analyticsService";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { prisma } from "../../config/database";

const router = Router();

// Base analytics route
router.get("/analytics", (_req, res) => {
  res.json({
    success: true,
    message: "Poll Analytics API",
    endpoints: {
      stats: "GET /api/polls/:id/stats (requires lecturer auth)",
      export: "GET /api/polls/:id/export?format=csv|json (requires lecturer auth)",
    },
  });
});

// Live stats
router.get("/:id/stats", authenticateToken, requireRole(["lecturer"]), async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const stats = await analyticsService.getPollStats(pollId);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Export (CSV or JSON) — CSV now matches the requested layout
router.get("/:id/export", authenticateToken, requireRole(["lecturer"]), async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);
    const format = ((req.query.format as string) || "json").toLowerCase();

    if (format === "csv") {
      const meta = await prisma.poll.findUnique({
        where: { id: pollId },
        select: { title: true },
      });
      const safeTitle =
        (meta?.title || "poll").replace(/[^a-z0-9_\- ]/gi, "").replace(/\s+/g, "_") || "poll";
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${safeTitle}_${ts}.csv`;

      const csv = await analyticsService.exportPollCsv(pollId);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(200).send(csv);
      return;
    }

    // default JSON stats
    const data = await analyticsService.getPollStats(pollId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
