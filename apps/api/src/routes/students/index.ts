import { Router } from "express";
import submissionsRoutes from "./submissions";

const router = Router();

// Base students route - shows available endpoints
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Students API",
    endpoints: {
      submissions: {
        get: "GET /api/students/:studentNumber/submissions",
        delete: "DELETE /api/students/:studentNumber/submissions/:pollId",
      },
    },
  });
});

// Mount submissions routes
router.use("/", submissionsRoutes);

export default router;
