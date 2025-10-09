import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { pollService } from "../../services/pollService";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { validateCreatePoll, handleValidationErrors } from "../../middleware/validation";

const router = Router();

/**
 * LIST (lecturer)
 */
router.get(
  "/",
  authenticateToken,
  requireRole(["lecturer"]),
  async (req: Request, res: Response) => {
    try {
      const polls = await pollService.getPollsByUser(req.user!.id);
      res.json({ success: true, data: polls });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

/**
 * GET by ID (lecturer sees correct answers, students don’t)
 */
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const pollId = Number(req.params.id);
    const includeAnswers = req.user!.role === "lecturer";
    const poll = await pollService.getPollById(pollId, includeAnswers);
    res.json({ success: true, data: poll });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

/**
 * CREATE (lecturer)
 */
router.post(
  "/",
  authenticateToken,
  requireRole(["lecturer"]),
  validateCreatePoll,
  async (req: Request, res: Response) => {
    try {
      const poll = await pollService.createPoll({
        ...req.body,
        createdBy: req.user!.id,
      });
      res.status(201).json({ success: true, data: poll });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

/**
 * UPDATE (lecturer)
 * Allows partial updates; only fields sent will be changed.
 */
router.put(
  "/:id",
  authenticateToken,
  requireRole(["lecturer"]),
  [
    body("title").optional().isString().isLength({ min: 1 }),
    body("description").optional({ nullable: true }).isString(),
    body("timerSeconds").optional().isInt({ min: 60 }),
    body("securityCode").optional({ nullable: true }).isString(),

    // Optional full questions payload (replace semantics handled in service)
    body("questions").optional().isArray({ min: 1 }),
    body("questions.*.id").optional().isInt({ min: 1 }),
    body("questions.*.text").optional().isString().isLength({ min: 1 }),
    body("questions.*.correctIndex").optional().isInt({ min: 0, max: 3 }),

    body("questions.*.options").optional().isArray({ min: 4, max: 4 }),
    body("questions.*.options.*.text").optional().isString().isLength({ min: 1 }),
    body("questions.*.options.*.index").optional().isInt({ min: 0, max: 3 }),

    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const pollId = Number(req.params.id);
      const updated = await pollService.updatePoll(pollId, req.user!.id, req.body ?? {});
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

/**
 * DELETE (lecturer)
 */
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["lecturer"]),
  async (req: Request, res: Response) => {
    try {
      const pollId = Number(req.params.id);
      await pollService.deletePoll(pollId, req.user!.id);
      res.json({ success: true, message: "Poll deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

export default router;
