"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const participationService_1 = require("../../services/participationService");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/polls/lobby:
 *   get:
 *     tags:
 *       - Lobby Management
 *     summary: Lobby endpoints info
 *     description: Returns available lobby management endpoints
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
 *                   example: "Poll Lobby API"
 *                 endpoints:
 *                   type: object
 */
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
/**
 * @openapi
 * /api/polls/{id}/lobby:
 *   get:
 *     tags:
 *       - Lobby Management
 *     summary: Get lobby participants
 *     description: Retrieves the list of students currently in the poll lobby (joined but haven't submitted yet)
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
 *         description: List of students in lobby
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LobbyEntry'
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
 *         description: Forbidden - Only lecturers can view lobby
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get current lobby (students who joined but haven't submitted yet)
router.get("/:id/lobby", auth_1.authenticateToken, (0, auth_1.requireRole)(["lecturer"]), async (req, res) => {
    try {
        const pollId = parseInt(req.params.id);
        const students = await participationService_1.participationService.getLobbyStudents(pollId);
        res.json({ success: true, data: students });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
/**
 * @openapi
 * /api/polls/{id}/lobby/{studentNumber}:
 *   delete:
 *     tags:
 *       - Lobby Management
 *     summary: Remove student from lobby
 *     description: Kicks/removes a student from the poll lobby. Student can rejoin if poll is still open.
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
 *       - in: path
 *         name: studentNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Student number to remove
 *         example: "12345678"
 *     responses:
 *       200:
 *         description: Student removed from lobby successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Student removed from poll"
 *       400:
 *         description: Invalid poll ID or student not found in lobby
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
 *         description: Forbidden - Only lecturers can remove students from lobby
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Kick a student from the lobby
router.delete("/:id/lobby/:studentNumber", auth_1.authenticateToken, (0, auth_1.requireRole)(["lecturer"]), async (req, res) => {
    try {
        const pollId = parseInt(req.params.id);
        const { studentNumber } = req.params;
        const result = await participationService_1.participationService.kickStudentFromLobby(pollId, studentNumber);
        // If you later add sockets, you can notify here.
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=lobby.js.map