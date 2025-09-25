import { Router, Request, Response } from "express";
import { pollService } from "../../services/pollService";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { validateCreatePoll } from "../../middleware/validation";

const router = Router();

// Get all polls for authenticated lecturer
router.get(
  "/",
  authenticateToken,
  requireRole(["lecturer"]),
  async (req: Request, res: Response) => {
    try {
      const polls = await pollService.getPollsByUser(req.user!.id);
      res.json({
        success: true,
        data: polls,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// Get poll by ID
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const pollId = parseInt(req.params.id);
    const includeAnswers = req.user!.role === "lecturer";

    const poll = await pollService.getPollById(pollId, includeAnswers);
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

// Create new poll
router.post(
  "/",
  authenticateToken,
  requireRole(["lecturer"]),
  validateCreatePoll,
  async (req: Request, res: Response) => {
    try {
      const pollData = {
        ...req.body,
        createdBy: req.user!.id,
      };

      const poll = await pollService.createPoll(pollData);
      res.status(201).json({
        success: true,
        data: poll,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// Update poll
router.put(
  "/:id",
  authenticateToken,
  requireRole(["lecturer"]),
  validateCreatePoll,
  async (req: Request, res: Response) => {
    try {
      // Note: You'll need to implement updatePoll in pollService
      res.status(501).json({
        success: false,
        error: "Update functionality not implemented yet",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  },
);

// Delete poll
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["lecturer"]),
  async (req: Request, res: Response) => {
    try {
      const pollId = parseInt(req.params.id);
      await pollService.deletePoll(pollId, req.user!.id);

      res.json({
        success: true,
        message: "Poll deleted successfully",
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
