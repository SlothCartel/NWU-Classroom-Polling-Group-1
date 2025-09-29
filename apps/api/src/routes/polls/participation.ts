import { Router, Request, Response } from "express";
import { participationService } from "../../services/participationService";
import { pollService } from "../../services/pollService";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { body } from "express-validator";
import { handleValidationErrors } from "../../middleware/validation";

const router = Router();

// Base participation route
router.get("/participation", (req, res) => {
  res.json({
    success: true,
    message: "Poll Participation API",
    endpoints: {
      getByCode: "GET /api/polls/code/:joinCode",
      join: "POST /api/polls/join",
      recordChoice: "POST /api/polls/:id/choices (requires student auth)",
      submit: "POST /api/polls/:id/submit (requires student auth)",
    },
  });
});

// Get poll by join code (for students)
router.get("/code/:joinCode", async (req: Request, res: Response) => {
  try {
    const poll = await pollService.getPollByJoinCode(req.params.joinCode);
    res.json({
      success: true,
      data: poll,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

// Join poll (student registration)
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
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// Record live choice during poll (real-time)
router.post(
  "/:id/choices",
  authenticateToken,
  requireRole(["student"]),
  async (req: Request, res: Response) => {
    try {
      // This endpoint is for real-time choice tracking
      // The actual data handling is done via WebSocket
      // This is just for HTTP fallback
      res.json({
        success: true,
        message: "Choice recorded",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// Submit final answers
router.post(
  "/:id/submit",
  authenticateToken,
  requireRole(["student"]),
  [
    body("answers").isArray({ min: 1 }).withMessage("At least one answer is required"),
    body("answers.*.questionId").isInt().withMessage("Valid question ID is required"),
    body("answers.*.optionIndex").isInt({ min: 0 }).withMessage("Valid option index is required"),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const pollId = parseInt(req.params.id);
      const submitData = {
        pollId,
        userId: req.user!.id,
        answers: req.body.answers,
      };

      const result = await participationService.submitAnswers(submitData);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },
);

export default router;
