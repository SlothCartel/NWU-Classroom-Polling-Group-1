"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../../services/authService");
const validation_1 = require("../../middleware/validation");
const router = (0, express_1.Router)();
// Base lecturer auth route
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Lecturer Authentication API",
        endpoints: {
            signup: "POST /api/auth/lecturer/signup",
            login: "POST /api/auth/lecturer/login",
            signin: "POST /api/auth/lecturer/signin",
            signout: "POST /api/auth/lecturer/signout",
        },
    });
});
// Lecturer signup
router.post("/signup", validation_1.validateLecturerSignup, async (req, res) => {
    try {
        const result = await authService_1.authService.signupLecturer(req.body);
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
// Lecturer signin
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
// Lecturer login (alias for signin)
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
// Lecturer signout
router.post("/signout", (req, res) => {
    res.json({
        success: true,
        message: "Signed out successfully",
    });
});
exports.default = router;
//# sourceMappingURL=lecturer.js.map