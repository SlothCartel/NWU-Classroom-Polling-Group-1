// apps/api/src/routes/auth.ts
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { JWT_SECRET } from "../config/env.js";
import { validateRegistration, validateLogin } from "../middleware/validation.js";

const router = express.Router();
const prisma = new PrismaClient();

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { userId, password, role, firstName, lastName } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { userId }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        userId,
        password: hashedPassword,
        role,
        firstName,
        lastName
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, userId: user.userId, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        userId: user.userId,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { userId, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, userId: user.userId, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        userId: user.userId,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
