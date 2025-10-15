"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pollService_1 = require("../../services/pollService");
const auth_1 = require("../../middleware/auth");
const socketService_1 = require("../../services/socketService");
const router = (0, express_1.Router)();
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
router.post("/:id/open", auth_1.authenticateToken, (0, auth_1.requireRole)(["lecturer"]), async (req, res) => {
    try {
        const pollId = parseInt(req.params.id);
        const poll = await pollService_1.pollService.updatePollStatus(pollId, "open", req.user.id);
        // Broadcast status change via WebSocket
        const socketService = (0, socketService_1.getSocketService)();
        socketService.broadcastPollStatusChange(poll.id, "open", poll);
        res.json({
            success: true,
            data: poll,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// Start poll (make it live)
router.post("/:id/start", auth_1.authenticateToken, (0, auth_1.requireRole)(["lecturer"]), async (req, res) => {
    try {
        const pollId = parseInt(req.params.id);
        const poll = await pollService_1.pollService.updatePollStatus(pollId, "live", req.user.id);
        // Broadcast status change via WebSocket
        const socketService = (0, socketService_1.getSocketService)();
        socketService.broadcastPollStatusChange(poll.id, "live", poll);
        res.json({
            success: true,
            data: poll,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// Close/end poll
router.post("/:id/close", auth_1.authenticateToken, (0, auth_1.requireRole)(["lecturer"]), async (req, res) => {
    try {
        const pollId = parseInt(req.params.id);
        const poll = await pollService_1.pollService.updatePollStatus(pollId, "closed", req.user.id);
        // Broadcast status change via WebSocket
        const socketService = (0, socketService_1.getSocketService)();
        socketService.broadcastPollStatusChange(poll.id, "closed", poll);
        res.json({
            success: true,
            data: poll,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=lifecycle.js.map