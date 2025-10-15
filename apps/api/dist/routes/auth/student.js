"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../../services/authService");
const validation_1 = require("../../middleware/validation");
const router = (0, express_1.Router)();
// Base student auth route
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Student Authentication API",
        endpoints: {
            signup: "POST /api/auth/student/signup",
            login: "POST /api/auth/student/login",
            signin: "POST /api/auth/student/signin",
            signout: "POST /api/auth/student/signout",
        },
    });
});
// Student signup
router.post("/signup", validation_1.validateStudentSignup, async (req, res) => {
    try {
        const result = await authService_1.authService.signupStudent(req.body);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// Student signin
router.post("/signin", validation_1.validateSignin, async (req, res) => {
    try {
        const result = await authService_1.authService.signin(req.body);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// Student login (alias for signin)
router.post("/login", validation_1.validateSignin, async (req, res) => {
    try {
        const result = await authService_1.authService.signin(req.body);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
// Student signout (client-side token removal, but we can log it)
router.post("/signout", (req, res) => {
    // In a real app, you might want to blacklist the token
    res.json({
        success: true,
        message: "Signed out successfully",
    });
});
exports.default = router;
//# sourceMappingURL=student.js.map