"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsService_1 = require("../../services/analyticsService");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/students/submissions:
 *   get:
 *     tags:
 *       - Student Submissions
 *     summary: Submissions endpoints info
 *     description: Returns available student submission endpoints
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
 *                   example: "Student Submissions API"
 *                 endpoints:
 *                   type: object
 */
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
/**
 * @openapi
 * /api/students/{studentNumber}/submissions:
 *   get:
 *     tags:
 *       - Student Submissions
 *     summary: Get student submission history
 *     description: Retrieves all submissions for a specific student. Students can only access their own data.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Student number
 *         example: "12345678"
 *     responses:
 *       200:
 *         description: Student submission history
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
 *                     $ref: '#/components/schemas/StudentSubmission'
 *       400:
 *         description: Invalid student number or student not found
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
 *         description: Forbidden - Students can only access their own submissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
/**
 * @openapi
 * /api/students/{studentNumber}/submissions/{pollId}:
 *   delete:
 *     tags:
 *       - Student Submissions
 *     summary: Delete student submission
 *     description: Deletes a specific submission from student's history. Students can only delete their own submissions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Student number
 *         example: "12345678"
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Submission deleted successfully
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
 *                       example: "Submission deleted successfully"
 *       400:
 *         description: Invalid parameters or submission not found
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
 *         description: Forbidden - Students can only delete their own submissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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