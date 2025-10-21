import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { pollService } from "../../services/pollService";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { validateCreatePoll, handleValidationErrors } from "../../middleware/validation";

const router = Router();

/**
 * @openapi
 * /api/polls:
 *   get:
 *     tags:
 *       - Poll Management
 *     summary: Get all lecturer's polls
 *     description: Retrieves all polls created by the authenticated lecturer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of polls
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Poll'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Only lecturers can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
 * @openapi
 * /api/polls/{id}:
 *   get:
 *     tags:
 *       - Poll Management
 *     summary: Get poll by ID
 *     description: Retrieves a specific poll. Lecturers see correct answers, students don't.
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
 *     responses:
 *       200:
 *         description: Poll details
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
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Poll not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * GET by ID (lecturer sees correct answers, students don't)
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
 * @openapi
 * /api/polls:
 *   post:
 *     tags:
 *       - Poll Management
 *     summary: Create a new poll
 *     description: Creates a new poll with questions and options. Only lecturers can create polls.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePollRequest'
 *     responses:
 *       201:
 *         description: Poll created successfully
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
 *         description: Forbidden - Only lecturers can create polls
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
 * @openapi
 * /api/polls/{id}:
 *   put:
 *     tags:
 *       - Poll Management
 *     summary: Update a poll
 *     description: Updates an existing poll. Allows partial updates - only fields sent will be changed. Only the poll creator can update it.
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
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Quiz Title"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *                 nullable: true
 *               timerSeconds:
 *                 type: integer
 *                 minimum: 60
 *                 example: 300
 *               securityCode:
 *                 type: string
 *                 example: "1234"
 *                 nullable: true
 *               questions:
 *                 type: array
 *                 description: Complete replacement of questions if provided
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Question ID (for existing questions)
 *                     text:
 *                       type: string
 *                     correctIndex:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 3
 *                     options:
 *                       type: array
 *                       minItems: 4
 *                       maxItems: 4
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                           index:
 *                             type: integer
 *                             minimum: 0
 *                             maximum: 3
 *     responses:
 *       200:
 *         description: Poll updated successfully
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
 *         description: Validation error or unauthorized to update this poll
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
 *         description: Forbidden - Only lecturers can update polls
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
 * @openapi
 * /api/polls/{id}:
 *   delete:
 *     tags:
 *       - Poll Management
 *     summary: Delete a poll
 *     description: Permanently deletes a poll and all associated data (questions, answers, submissions). Only the poll creator can delete it.
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
 *     responses:
 *       200:
 *         description: Poll deleted successfully
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
 *                   example: "Poll deleted successfully"
 *       400:
 *         description: Unauthorized to delete this poll or poll not found
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
 *         description: Forbidden - Only lecturers can delete polls
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
