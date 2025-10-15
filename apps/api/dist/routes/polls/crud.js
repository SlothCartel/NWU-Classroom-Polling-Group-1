"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const pollService_1 = require("../../services/pollService");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
const router = (0, express_1.Router)();
/**
 * LIST (lecturer)
 */
router.get("/", auth_1.authenticateToken, (0, auth_1.requireRole)(["lecturer"]), async (req, res) => {
    try {
        const polls = await pollService_1.pollService.getPollsByUser(req.user.id);
        res.json({ success: true, data: polls });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET by ID (lecturer sees correct answers, students don’t)
 */
router.get("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const pollId = Number(req.params.id);
        const includeAnswers = req.user.role === "lecturer";
        const poll = await pollService_1.pollService.getPollById(pollId, includeAnswers);
        res.json({ success: true, data: poll });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});
/**
 * CREATE (lecturer)
 */
router.post("/", auth_1.authenticateToken, (0, auth_1.requireRole)(["lecturer"]), validation_1.validateCreatePoll, async (req, res) => {
    try {
        const poll = await pollService_1.pollService.createPoll({
            ...req.body,
            createdBy: req.user.id,
        });
        res.status(201).json({ success: true, data: poll });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
/**
 * UPDATE (lecturer)
 * Allows partial updates; only fields sent will be changed.
 */
router.put("/:id", auth_1.authenticateToken, (0, auth_1.requireRole)(["lecturer"]), [
    (0, express_validator_1.body)("title").optional().isString().isLength({ min: 1 }),
    (0, express_validator_1.body)("description").optional({ nullable: true }).isString(),
    (0, express_validator_1.body)("timerSeconds").optional().isInt({ min: 60 }),
    (0, express_validator_1.body)("securityCode").optional({ nullable: true }).isString(),
    // Optional full questions payload (replace semantics handled in service)
    (0, express_validator_1.body)("questions").optional().isArray({ min: 1 }),
    (0, express_validator_1.body)("questions.*.id").optional().isInt({ min: 1 }),
    (0, express_validator_1.body)("questions.*.text").optional().isString().isLength({ min: 1 }),
    (0, express_validator_1.body)("questions.*.correctIndex").optional().isInt({ min: 0, max: 3 }),
    (0, express_validator_1.body)("questions.*.options").optional().isArray({ min: 4, max: 4 }),
    (0, express_validator_1.body)("questions.*.options.*.text").optional().isString().isLength({ min: 1 }),
    (0, express_validator_1.body)("questions.*.options.*.index").optional().isInt({ min: 0, max: 3 }),
    validation_1.handleValidationErrors,
], async (req, res) => {
    try {
        const pollId = Number(req.params.id);
        const updated = await pollService_1.pollService.updatePoll(pollId, req.user.id, req.body ?? {});
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
/**
 * DELETE (lecturer)
 */
router.delete("/:id", auth_1.authenticateToken, (0, auth_1.requireRole)(["lecturer"]), async (req, res) => {
    try {
        const pollId = Number(req.params.id);
        await pollService_1.pollService.deletePoll(pollId, req.user.id);
        res.json({ success: true, message: "Poll deleted successfully" });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=crud.js.map