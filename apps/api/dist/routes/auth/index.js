"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_1 = __importDefault(require("./student"));
const lecturer_1 = __importDefault(require("./lecturer"));
const router = (0, express_1.Router)();
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
router.use("/student", student_1.default);
// Mount lecturer auth routes
router.use("/lecturer", lecturer_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map