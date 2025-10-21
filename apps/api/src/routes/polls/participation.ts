import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { handleValidationErrors } from "../../middleware/validation";
import { pollService } from "../../services/pollService";
import { participationService } from "../../services/participationService";

const router = Router();

/**
 * @openapi
 * /api/polls/participation:
 *   get:
 *     tags:
 *       - Student Participation
 *     summary: Participation endpoints info
 *     description: Returns available student participation endpoints
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
 *                   example: "Poll Participation API"
 *                 endpoints:
 *                   type: object
 */
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
 * @openapi
 * /api/polls/code/{joinCode}:
 *   get:
 *     tags:
 *       - Student Participation
 *     summary: Get poll by join code
 *     description: Retrieves poll details using a join code. Does not include correct answers. No authentication required.
 *     parameters:
 *       - in: path
 *         name: joinCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 6-character join code
 *         example: "ABC123"
 *     responses:
 *       200:
 *         description: Poll found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Poll'
 *       404:
 *         description: Poll not found with this join code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
 * @openapi
 * /api/polls/join:
 *   post:
 *     tags:
 *       - Student Participation
 *     summary: Join a poll
 *     description: Allows a student to join a poll using a join code. Creates a lobby entry so the lecturer can see attendance immediately. No authentication required initially, but student must exist in the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JoinPollRequest'
 *     responses:
 *       200:
 *         description: Successfully joined the poll
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Poll'
 *       400:
 *         description: Invalid join code, security code, poll not open, or student already submitted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
 * @openapi
 * /api/polls/{id}/choices:
 *   post:
 *     tags:
 *       - Student Participation
 *     summary: Record live answer choice
 *     description: Records a student's live answer selection for real-time tracking. Can be called multiple times as student changes their answer. Option index -1 means "clear/not answered".
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *               - optionIndex
 *             properties:
 *               questionId:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *                 description: ID of the question being answered
 *               optionIndex:
 *                 type: integer
 *                 minimum: -1
 *                 maximum: 3
 *                 example: 2
 *                 description: Selected option index (0-3) or -1 for unanswered
 *     responses:
 *       200:
 *         description: Choice recorded successfully
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
 *                   example: "Choice recorded"
 *       400:
 *         description: Validation error or invalid request
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
 *         description: Forbidden - Only students can record choices
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * Student (auth): record a live choice for a question.
 * - optionIndex -1 means "clear / not answered"
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
 * @openapi
 * /api/polls/{id}/submit:
 *   post:
 *     tags:
 *       - Student Participation
 *     summary: Submit final answers
 *     description: Submits final answers for grading. Creates a submission record with score and feedback. Student can only submit once per poll. Accepts empty answers array if student never answered.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Poll ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmitAnswersRequest'
 *     responses:
 *       200:
 *         description: Answers submitted successfully with grading results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmitResponse'
 *       400:
 *         description: Validation error, already submitted, or poll not live/closed
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
 *         description: Forbidden - Only students can submit answers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
