import { Router } from "express";
import studentRoutes from "./student";
import lecturerRoutes from "./lecturer";

const router = Router();

// Base auth route - shows available auth endpoints
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Authentication API",
    endpoints: {
      lecturer: {
        signup: "POST /api/auth/lecturer/signup",
        login: "POST /api/auth/lecturer/login",
      },
      student: {
        signup: "POST /api/auth/student/signup",
        login: "POST /api/auth/student/login",
      },
    },
  });
});

// Mount student auth routes
router.use("/student", studentRoutes);

// Mount lecturer auth routes
router.use("/lecturer", lecturerRoutes);

export default router;
