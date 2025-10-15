"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const polls_1 = __importDefault(require("./routes/polls"));
const students_1 = __importDefault(require("./routes/students"));
const app = (0, express_1.default)();
// Read CORS origin from env for both local and production
const allowedOrigins = [
    "http://localhost:5173", // local vite dev
    "https://nwu-live-poll.vercel.app", // your Vercel frontend
    "https://zsn02j9r-8080.inc1.devtunnels.ms", // your dev tunnel
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow requests with no origin (like curl, mobile apps)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        else {
            return callback(new Error("CORS not allowed for this origin"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
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
app.use("/api/auth", auth_1.default);
app.use("/api/polls", polls_1.default);
app.use("/api/students", students_1.default);
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
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map