import { createServer } from "http";
import app from "./app";
import { initializeSocketService } from "./services/socketService";
import { prisma } from "./config/database";

const PORT = process.env.PORT || 8080;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
initializeSocketService(server);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Read CORS origin from env for both local and production
    const allowedOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server initialized`);
      console.log(`🌐 Allowed origin: ${allowedOrigin}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

startServer();
