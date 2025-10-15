"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreatePoll = exports.validateSignin = exports.validateLecturerSignup = exports.validateStudentSignup = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: "Validation failed",
            details: errors.array(),
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.validateStudentSignup = [
    (0, express_validator_1.body)("name").notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.body)("studentNumber").notEmpty().withMessage("Student number is required"),
    (0, express_validator_1.body)("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    exports.handleValidationErrors,
];
exports.validateLecturerSignup = [
    (0, express_validator_1.body)("name").notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.body)("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    exports.handleValidationErrors,
];
exports.validateSignin = [
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
    exports.handleValidationErrors,
];
exports.validateCreatePoll = [
    (0, express_validator_1.body)("title").notEmpty().withMessage("Poll title is required"),
    (0, express_validator_1.body)("questions").isArray({ min: 1 }).withMessage("At least one question is required"),
    (0, express_validator_1.body)("questions.*.text").notEmpty().withMessage("Question text is required"),
    (0, express_validator_1.body)("questions.*.options").isArray({ min: 2 }).withMessage("At least two options are required"),
    (0, express_validator_1.body)("questions.*.correctIndex").isInt({ min: 0 }).withMessage("Valid correct index is required"),
    exports.handleValidationErrors,
];
//# sourceMappingURL=validation.js.map