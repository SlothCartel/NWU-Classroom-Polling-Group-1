"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const submissions_1 = __importDefault(require("./submissions"));
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/students:
 *   get:
 *     tags:
 *       - Student Submissions
 *     summary: Students API endpoints info
 *     description: Returns available student-related endpoints
 *     responses:
 *       200:
 *         description: List of student endpoints
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
 *                   example: "Students API"
 *                 endpoints:
 *                   type: object
 */
// Base students route - shows available endpoints
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Students API",
        endpoints: {
            submissions: {
                get: "GET /api/students/:studentNumber/submissions",
                delete: "DELETE /api/students/:studentNumber/submissions/:pollId",
            },
        },
    });
});
// Mount submissions routes
router.use("/", submissions_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map