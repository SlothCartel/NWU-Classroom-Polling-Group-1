import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import pollRoutes from "./routes/polls";
import studentRoutes from "./routes/students";

// Force restart
console.log('🔄 Starting server with updated CORS configuration...');

const app = express();

// CORS Headers middleware - MUST be first to ensure headers are always set
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('🌐 Request:', req.method, req.path, 'from origin:', origin); // Updated CORS handling

  // For debugging - be more permissive temporarily
  const isAllowed = !origin ||
                   origin.includes('localhost') ||
                   origin.includes('vercel.app') ||
                   origin.includes('devtunnels.ms') ||
                   allowedOrigins.some(allowed =>
                     (typeof allowed === 'string' && allowed === origin) ||
                     (allowed instanceof RegExp && allowed.test(origin))
                   );

  if (isAllowed) {
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-csrf-token");
    res.header("Access-Control-Allow-Credentials", "true");
    console.log('✅ CORS headers set for origin:', origin);
  } else {
    console.log('❌ Origin rejected:', origin);
    console.log('📋 Allowed origins:', allowedOrigins);
  }

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log('🔧 Handling OPTIONS preflight request');
    return res.sendStatus(200);
  }

  next();
});

// Read CORS origin from env for both local and production
const allowedOrigins = [
  "http://localhost:5173", // local vite dev
  "https://nwu-live-poll.vercel.app", // your Vercel frontend
  "https://zsn02j9r-8080.inc1.devtunnels.ms", // your dev tunnel (no trailing slash)
  // Add pattern for any Vercel app
  /https:\/\/.*\.vercel\.app$/,
];



app.use(
  cors({
    origin: (origin, callback) => {
      console.log('🌐 CORS Request from origin:', origin);

      // allow requests with no origin (like curl, mobile apps)
      if (!origin) {
        console.log('✅ Allowing request with no origin');
        return callback(null, true);
      }

      // Check string origins
      if (allowedOrigins.some(allowed =>
        typeof allowed === 'string' && allowed === origin
      )) {
        console.log('✅ Origin allowed (string match):', origin);
        return callback(null, true);
      }

      // Check regex patterns
      if (allowedOrigins.some(allowed =>
        allowed instanceof RegExp && allowed.test(origin)
      )) {
        console.log('✅ Origin allowed (regex match):', origin);
        return callback(null, true);
      }

      console.log('❌ Origin not allowed:', origin);
      console.log('📋 Allowed origins:', allowedOrigins);
      return callback(new Error("CORS not allowed for this origin"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  })
);

// Explicit OPTIONS handler for all routes to ensure CORS works - MUST be before other middleware
app.options("*", (req, res) => {
  console.log('🔧 Handling OPTIONS request for:', req.path, 'from origin:', req.headers.origin);
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-csrf-token");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// Add middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NWU Live Poll API Documentation',
}));

// API spec as JSON
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});



/**
 * @openapi
 * /api:
 *   get:
 *     tags:
 *       - Health & Info
 *     summary: API information endpoint
 *     description: Returns API status, version, and available endpoints
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "NWU Live Poll API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: "/api/auth"
 *                     polls:
 *                       type: string
 *                       example: "/api/polls"
 *                     students:
 *                       type: string
 *                       example: "/api/students"
 */
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

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health & Info
 *     summary: Health check endpoint
 *     description: Simple health check to verify API is running
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
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
