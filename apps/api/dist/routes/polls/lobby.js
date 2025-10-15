"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const participationService_1 = require("../../services/participationService");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
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