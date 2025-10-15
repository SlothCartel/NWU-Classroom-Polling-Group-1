"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsService_1 = require("../../services/analyticsService");
const auth_1 = require("../../middleware/auth");
const database_1 = require("../../config/database");
const router = (0, express_1.Router)();
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
router.get("/:id/stats", auth_1.authenticateToken, (0, auth_1.requireRole)(["lecturer"]), async (req, res) => {
    try {
        const pollId = parseInt(req.params.id);
        const stats = await analyticsService_1.analyticsService.getPollStats(pollId);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Export (CSV or JSON) — CSV now matches the requested layout
router.get("/:id/export", auth_1.authenticateToken, (0, auth_1.requireRole)(["lecturer"]), async (req, res) => {
    try {
        const pollId = parseInt(req.params.id);
        const format = (req.query.format || "json").toLowerCase();
        if (format === "csv") {
            const meta = await database_1.prisma.poll.findUnique({
                where: { id: pollId },
                select: { title: true },
            });
            const safeTitle = (meta?.title || "poll").replace(/[^a-z0-9_\- ]/gi, "").replace(/\s+/g, "_") || "poll";
            const ts = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = `${safeTitle}_${ts}.csv`;
            const csv = await analyticsService_1.analyticsService.exportPollCsv(pollId);
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.status(200).send(csv);
            return;
        }
        // default JSON stats
        const data = await analyticsService_1.analyticsService.getPollStats(pollId);
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map