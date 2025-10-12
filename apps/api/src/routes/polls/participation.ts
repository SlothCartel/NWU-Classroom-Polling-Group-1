import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { handleValidationErrors } from "../../middleware/validation";
import { pollService } from "../../services/pollService";
import { participationService } from "../../services/participationService";

const router = Router();

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
router.get("/code/:joinCode", async (req: Request, res: Response) => {
  try {
    const poll = await pollService.getPollByJoinCode(req.params.joinCode);
    res.json({ success: true, data: poll });
  } catch (e: any) {
    res.status(404).json({ success: false, error: e.message });
  }
});

/**
 * Public: join (validates code/security; ensures LobbyEntry so lecturer sees attendance immediately)
 */
router.post(
  "/join",
  [
    body("joinCode").notEmpty().withMessage("Join code is required"),
    body("studentNumber").notEmpty().withMessage("Student number is required"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const result = await participationService.joinPoll(req.body);
      res.json({ success: true, data: result });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  },
);

/**
 * Student (auth): record a live choice for a question.
 * - optionIndex -1 means “clear / not answered”
 * - Upserts a Vote per (question_id, user_id)
 */
router.post(
  "/:id/choices",
  authenticateToken,
  requireRole(["student"]),
  [
    body("questionId").toInt().isInt({ min: 1 }).withMessage("Valid questionId is required"),
    body("optionIndex")
      .customSanitizer((v) => {
        if (v === undefined || v === null || v === "") return -1;
        const n = parseInt(String(v), 10);
        return Number.isFinite(n) ? n : -1;
      })
      .custom((n) => n >= -1 && n <= 3)
      .withMessage("optionIndex must be -1..3"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const pollId = Number(req.params.id);
      const { questionId, optionIndex } = req.body as { questionId: number; optionIndex: number };

      await participationService.recordLiveChoice({
        pollId,
        userId: req.user!.id,
        questionId,
        optionIndex,
      });

      res.json({ success: true, message: "Choice recorded" });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  },
);

/**
 * Student (auth): final submit
 * - Accepts empty answers array (e.g., lecturer ended or student never clicked)
 * - Each answer: { questionId?, optionIndex } with optionIndex in -1..3
 */
router.post(
  "/:id/submit",
  authenticateToken,
  requireRole(["student"]),
  [
    body("answers").isArray().withMessage("Answers must be an array"),

    body("answers.*.questionId")
      .optional({ nullable: true })
      .toInt()
      .isInt({ min: 1 })
      .withMessage("Valid question ID is required"),

    body("answers.*.optionIndex")
      .customSanitizer((v) => {
        if (v === undefined || v === null || v === "") return -1;
        const n = parseInt(String(v), 10);
        return Number.isFinite(n) ? n : -1;
      })
      .custom((n) => n >= -1 && n <= 3)
      .withMessage("Option index must be -1 (unanswered) or 0–3"),

    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const pollId = Number(req.params.id);
      const result = await participationService.submitAnswers({
        pollId,
        userId: req.user!.id,
        answers: req.body.answers ?? [],
      });
      res.json({ success: true, data: result });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  },
);

export default router;
