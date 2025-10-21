"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pollService_1 = require("../../services/pollService");
const auth_1 = require("../../middleware/auth");
const socketService_1 = require("../../services/socketService");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/polls/lifecycle:
 *   get:
 *     tags:
 *       - Poll Lifecycle
 *     summary: Poll lifecycle endpoints info
 *     description: Returns available poll lifecycle management endpoints
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
 *                   example: "Poll Lifecycle API"
 *                 endpoints:
 *                   type: object
 */
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
/**
 * @openapi
 * /api/polls/{id}/open:
 *   post:
 *     tags:
 *       - Poll Lifecycle
 *     summary: Open poll for joining
 *     description: Changes poll status to 'open', allowing students to join the lobby. Broadcasts status change via WebSocket.
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
 *         description: Poll opened successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Poll'
 *       400:
 *         description: Invalid poll ID or unauthorized
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
 *         description: Forbidden - Only lecturers can open polls
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
/**
 * @openapi
 * /api/polls/{id}/start:
 *   post:
 *     tags:
 *       - Poll Lifecycle
 *     summary: Start poll (make it live)
 *     description: Changes poll status to 'live', allowing students to answer questions. Broadcasts status change via WebSocket.
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
 *         description: Poll started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Poll'
 *       400:
 *         description: Invalid poll ID or unauthorized
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
 *         description: Forbidden - Only lecturers can start polls
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
/**
 * @openapi
 * /api/polls/{id}/close:
 *   post:
 *     tags:
 *       - Poll Lifecycle
 *     summary: Close/end poll
 *     description: Changes poll status to 'closed', preventing further submissions. Broadcasts status change via WebSocket.
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
 *         description: Poll closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Poll'
 *       400:
 *         description: Invalid poll ID or unauthorized
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
 *         description: Forbidden - Only lecturers can close polls
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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