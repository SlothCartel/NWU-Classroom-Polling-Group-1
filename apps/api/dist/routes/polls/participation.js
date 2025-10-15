"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
const pollService_1 = require("../../services/pollService");
const participationService_1 = require("../../services/participationService");
const router = (0, express_1.Router)();
/**
 * Base participation route (info)
 */
router.get("/participation", (_req, res) => {
    res.json({
        success: true,
        message: "Poll Participation API",
        endpoints: {
            getByCode: "GET /api/polls/code/:joinCode",
            join: "POST /api/polls/join",
            recordChoice: "POST /api/polls/:id/choices (student auth)",
            submit: "POST /api/polls/:id/submit (student auth)",
        },
    });
});
/**
 * Public: fetch poll meta by join code (no correct answers)
 */
router.get("/code/:joinCode", async (req, res) => {
    try {
        const poll = await pollService_1.pollService.getPollByJoinCode(req.params.joinCode);
        res.json({ success: true, data: poll });
    }
    catch (e) {
        res.status(404).json({ success: false, error: e.message });
    }
});
/**
 * Public: join (validates code/security; ensures LobbyEntry so lecturer sees attendance immediately)
 */
router.post("/join", [
    (0, express_validator_1.body)("joinCode").notEmpty().withMessage("Join code is required"),
    (0, express_validator_1.body)("studentNumber").notEmpty().withMessage("Student number is required"),
    validation_1.handleValidationErrors,
], async (req, res) => {
    try {
        const result = await participationService_1.participationService.joinPoll(req.body);
        res.json({ success: true, data: result });
    }
    catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});
/**
 * Student (auth): record a live choice for a question.
 * - optionIndex -1 means “clear / not answered”
 * - Upserts a Vote per (question_id, user_id)
 */
router.post("/:id/choices", auth_1.authenticateToken, (0, auth_1.requireRole)(["student"]), [
    (0, express_validator_1.body)("questionId").toInt().isInt({ min: 1 }).withMessage("Valid questionId is required"),
    (0, express_validator_1.body)("optionIndex")
        .customSanitizer((v) => {
        if (v === undefined || v === null || v === "")
            return -1;
        const n = parseInt(String(v), 10);
        return Number.isFinite(n) ? n : -1;
    })
        .custom((n) => n >= -1 && n <= 3)
        .withMessage("optionIndex must be -1..3"),
    validation_1.handleValidationErrors,
], async (req, res) => {
    try {
        const pollId = Number(req.params.id);
        const { questionId, optionIndex } = req.body;
        await participationService_1.participationService.recordLiveChoice({
            pollId,
            userId: req.user.id,
            questionId,
            optionIndex,
        });
        res.json({ success: true, message: "Choice recorded" });
    }
    catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});
/**
 * Student (auth): final submit
 * - Accepts empty answers array (e.g., lecturer ended or student never clicked)
 * - Each answer: { questionId?, optionIndex } with optionIndex in -1..3
 */
router.post("/:id/submit", auth_1.authenticateToken, (0, auth_1.requireRole)(["student"]), [
    (0, express_validator_1.body)("answers").isArray().withMessage("Answers must be an array"),
    (0, express_validator_1.body)("answers.*.questionId")
        .optional({ nullable: true })
        .toInt()
        .isInt({ min: 1 })
        .withMessage("Valid question ID is required"),
    (0, express_validator_1.body)("answers.*.optionIndex")
        .customSanitizer((v) => {
        if (v === undefined || v === null || v === "")
            return -1;
        const n = parseInt(String(v), 10);
        return Number.isFinite(n) ? n : -1;
    })
        .custom((n) => n >= -1 && n <= 3)
        .withMessage("Option index must be -1 (unanswered) or 0–3"),
    validation_1.handleValidationErrors,
], async (req, res) => {
    try {
        const pollId = Number(req.params.id);
        const result = await participationService_1.participationService.submitAnswers({
            pollId,
            userId: req.user.id,
            answers: req.body.answers ?? [],
        });
        res.json({ success: true, data: result });
    }
    catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=participation.js.map