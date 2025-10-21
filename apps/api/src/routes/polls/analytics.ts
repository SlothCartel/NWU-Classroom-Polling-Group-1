import { Router } from "express";
import { analyticsService } from "../../services/analyticsService";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { prisma } from "../../config/database";

const router = Router();

/**
 * @openapi
 * /api/polls/analytics:
 *   get:
 *     tags:
 *       - Analytics & Statistics
 *     summary: Analytics endpoints info
 *     description: Returns available analytics and statistics endpoints
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
 *                   example: "Poll Analytics API"
 *                 endpoints:
 *                   type: object
 */
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

/**
 * @openapi
 * /api/polls/{id}/stats:
 *   get:
 *     tags:
 *       - Analytics & Statistics
 *     summary: Get poll statistics
 *     description: Retrieves comprehensive statistics for a poll including submission count, average scores, and per-question analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Poll statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PollStatistics'
 *       400:
 *         description: Invalid poll ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Only lecturers can view statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @openapi
 * /api/polls/{id}/export:
 *   get:
 *     tags:
 *       - Analytics & Statistics
 *     summary: Export poll results
 *     description: Exports poll results in JSON or CSV format. CSV includes detailed question and answer statistics.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *         example: 1
 *       - in: query
 *         name: format
 *         required: false
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *         example: csv
 *     responses:
 *       200:
 *         description: Exported poll data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PollStatistics'
 *           text/csv:
 *             schema:
 *               type: string
 *               example: "question,totalAnswers,correctAnswers,correctPercentage,option_0_count..."
 *       400:
 *         description: Invalid poll ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Only lecturers can export results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
