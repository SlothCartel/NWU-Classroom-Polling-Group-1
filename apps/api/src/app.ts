import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import pollRoutes from "./routes/polls";
import studentRoutes from "./routes/students";

const app = express();

// Read CORS origin from env for both local and production
const allowedOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint - let's add this!
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "NWU Live Poll API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      polls: "/api/polls",
      students: "/api/students",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/students", studentRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>NWU Live Poll API</h1>
        <p>API is running successfully!</p>
        <p><a href="/api/health">Health Check</a></p>
      </body>
    </html>
  `);
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Error handler
app.use(errorHandler);

export default app;
