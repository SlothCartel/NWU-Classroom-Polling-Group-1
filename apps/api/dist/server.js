"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const socketService_1 = require("./services/socketService");
const database_1 = require("./config/database");
console.log('🔄 Server starting with latest changes...');
const PORT = process.env.PORT || 8080;
// Create HTTP server
const server = (0, http_1.createServer)(app_1.default);
// Initialize Socket.IO
(0, socketService_1.initializeSocketService)(server);
// Start server
const startServer = async () => {
    try {
        // Test database connection
        await database_1.prisma.$connect();
        console.log("✅ Database connected successfully");
        // Read CORS origin from env for both local and production
        const allowedOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔌 WebSocket server initialized`);
            console.log(`🌐 Allowed origin: ${allowedOrigin}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};
// Graceful shutdown
process.on("SIGTERM", async () => {
    console.log("🛑 SIGTERM received, shutting down gracefully");
    await database_1.prisma.$disconnect();
    server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
    });
});
startServer();
//# sourceMappingURL=server.js.map