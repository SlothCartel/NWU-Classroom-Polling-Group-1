"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crud_1 = __importDefault(require("./crud"));
const lifecycle_1 = __importDefault(require("./lifecycle"));
const participation_1 = __importDefault(require("./participation"));
const lobby_1 = __importDefault(require("./lobby"));
const analytics_1 = __importDefault(require("./analytics"));
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/polls/info:
 *   get:
 *     tags:
 *       - Poll Management
 *     summary: Polls API endpoints info
 *     description: Returns an overview of all available poll-related endpoints organized by category
 *     responses:
 *       200:
 *         description: List of all poll endpoints
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
 *                   example: "Polls API"
 *                 endpoints:
 *                   type: object
 *                   description: Categorized list of all poll endpoints
 */
// Base polls route - shows available endpoints (for testing)
router.get("/info", (req, res) => {
    res.json({
        success: true,
        message: "Polls API",
        endpoints: {
            polls: {
                list: "GET /api/polls (requires lecturer auth)",
                get: "GET /api/polls/:id (requires auth)",
                create: "POST /api/polls (requires lecturer auth)",
                update: "PUT /api/polls/:id (requires lecturer auth)",
                delete: "DELETE /api/polls/:id (requires lecturer auth)",
            },
            lifecycle: {
                open: "POST /api/polls/:id/open",
                start: "POST /api/polls/:id/start",
                close: "POST /api/polls/:id/close",
            },
            participation: {
                join: "POST /api/polls/join/:code",
                submit: "POST /api/polls/:id/submit",
            },
            lobby: {
                status: "GET /api/polls/:id/lobby",
                participants: "GET /api/polls/:id/participants",
            },
            analytics: {
                results: "GET /api/polls/:id/results",
                export: "GET /api/polls/:id/export",
            },
        },
    });
});
// Mount specific routes BEFORE general CRUD routes
// Order matters! More specific routes must come before general ones
router.use("/", participation_1.default); // Student participation (includes /join, /code/:joinCode)
router.use("/", lifecycle_1.default); // Poll lifecycle (includes /lifecycle base route)
router.use("/", lobby_1.default); // Lobby management (includes /lobby base route)
router.use("/", analytics_1.default); // Statistics and export (includes /analytics base route)
router.use("/", crud_1.default); // Basic CRUD operations (includes /, /:id - must be last)
exports.default = router;
//# sourceMappingURL=index.js.map