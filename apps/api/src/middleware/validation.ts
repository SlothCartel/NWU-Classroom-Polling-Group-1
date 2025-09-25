import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

export const validateStudentSignup = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("studentNumber").notEmpty().withMessage("Student number is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  handleValidationErrors,
];

export const validateLecturerSignup = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  handleValidationErrors,
];

export const validateSignin = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

export const validateCreatePoll = [
  body("title").notEmpty().withMessage("Poll title is required"),
  body("questions").isArray({ min: 1 }).withMessage("At least one question is required"),
  body("questions.*.text").notEmpty().withMessage("Question text is required"),
  body("questions.*.options").isArray({ min: 2 }).withMessage("At least two options are required"),
  body("questions.*.correctIndex").isInt({ min: 0 }).withMessage("Valid correct index is required"),
  handleValidationErrors,
];
