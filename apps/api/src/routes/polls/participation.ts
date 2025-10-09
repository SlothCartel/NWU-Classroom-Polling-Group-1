import { Router, Request, Response } from "express";
import { participationService } from "../../services/participationService";
import { pollService } from "../../services/pollService";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { body } from "express-validator";
import { handleValidationErrors } from "../../middleware/validation";

const router = Router();

// Base participation route
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

// Public: fetch poll meta by code (no correct answers)
router.get("/code/:joinCode", async (req: Request, res: Response) => {
  try {
    const poll = await pollService.getPollByJoinCode(req.params.joinCode);
    res.json({ success: true, data: poll });
  } catch (e: any) {
    res.status(404).json({ success: false, error: e.message });
  }
});

// Public: join (validate code, security, student exists)
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

// Optional HTTP fallback for “live choice”
router.post(
  "/:id/choices",
  authenticateToken,
  requireRole(["student"]),
  async (_req: Request, res: Response) => {
    res.json({ success: true, message: "Choice recorded" });
  },
);

// Auth: final submit (allow zero or more answered items)
router.post(
  "/:id/submit",
  authenticateToken,
  requireRole(["student"]),
[
  // Answers can be an empty array (autosubmit / ended with no selections)
  body("answers")
    .isArray()
    .withMessage("Answers must be an array"),

  // If present, coerce questionId to int and validate
  body("answers.*.questionId")
    .optional({ nullable: true })
    .toInt()
    .isInt({ min: 1 })
    .withMessage("Valid question ID is required"),

  // Coerce optionIndex (string → number), allow -1..3
  body("answers.*.optionIndex")
    .customSanitizer((v) => {
      if (v === undefined || v === null || v === "") return -1; // treat missing as unanswered
      const n = parseInt(String(v), 10);
      return Number.isFinite(n) ? n : -1;
    })
    .custom((n) => n >= -1 && n <= 3)
    .withMessage("Option index must be -1 (unanswered) or 0–3"),

  handleValidationErrors,
],
  async (req, res) => {
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