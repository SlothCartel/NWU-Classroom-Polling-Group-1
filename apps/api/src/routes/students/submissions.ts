import { Router } from "express";
import { analyticsService } from "../../services/analyticsService";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

// Base submissions route
router.get("/submissions", (req, res) => {
  res.json({
    success: true,
    message: "Student Submissions API",
    endpoints: {
      getSubmissions: "GET /api/students/:studentNumber/submissions",
      deleteSubmission: "DELETE /api/students/:studentNumber/submissions/:pollId",
    },
  });
});

// Get student's submission history
router.get("/:studentNumber/submissions", authenticateToken, async (req, res) => {
  try {
    const { studentNumber } = req.params;

    // Students can only access their own submissions
    if (req.user!.role === "student" && req.user!.studentNumber !== studentNumber) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const submissions = await analyticsService.getStudentSubmissionHistory(studentNumber);
    res.json({
      success: true,
      data: submissions,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete student submission from history
router.delete("/:studentNumber/submissions/:pollId", authenticateToken, async (req, res) => {
  try {
    const { studentNumber, pollId } = req.params;

    // Students can only delete their own submissions
    if (req.user!.role === "student" && req.user!.studentNumber !== studentNumber) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const result = await analyticsService.deleteStudentSubmission(studentNumber, parseInt(pollId));
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
});

export default router;
