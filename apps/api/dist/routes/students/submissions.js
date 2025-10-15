"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsService_1 = require("../../services/analyticsService");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Base submissions route
router.get("/submissions", (req, res) => {
    res.json({
        success: true,
        message: "Student Submissions API",
        endpoints: {
            getSubmissions: "GET /api/students/:studentNumber/submissions",
            deleteSubmission: "DELETE /api/students/:studentNumber/submissions/:pollId",
        },
    });
});
// Get student's submission history
router.get("/:studentNumber/submissions", auth_1.authenticateToken, async (req, res) => {
    try {
        const { studentNumber } = req.params;
        // Students can only access their own submissions
        if (req.user.role === "student" && req.user.studentNumber !== studentNumber) {
            return res.status(403).json({
                success: false,
                error: "Access denied",
            });
        }
        const submissions = await analyticsService_1.analyticsService.getStudentSubmissionHistory(studentNumber);
        res.json({
            success: true,
            data: submissions,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// Delete student submission from history
router.delete("/:studentNumber/submissions/:pollId", auth_1.authenticateToken, async (req, res) => {
    try {
        const { studentNumber, pollId } = req.params;
        // Students can only delete their own submissions
        if (req.user.role === "student" && req.user.studentNumber !== studentNumber) {
            return res.status(403).json({
                success: false,
                error: "Access denied",
            });
        }
        const result = await analyticsService_1.analyticsService.deleteStudentSubmission(studentNumber, parseInt(pollId));
        res.json({
            success: true,
            data: result,
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
//# sourceMappingURL=submissions.js.map