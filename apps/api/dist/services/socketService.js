"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketService = exports.initializeSocketService = exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const authService_1 = require("./authService");
class SocketService {
    constructor(server) {
        this.pollRooms = new Map();
        // Read CORS origin from env for both local and production
        const allowedOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: allowedOrigin,
                methods: ["GET", "POST"],
            },
        });
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error("Authentication required"));
                }
                const user = await authService_1.authService.validateToken(token);
                if (!user) {
                    return next(new Error("Invalid token"));
                }
                socket.data.user = user;
                next();
            }
            catch {
                next(new Error("Authentication failed"));
            }
        });
    }
    setupEventHandlers() {
        this.io.on("connection", (socket) => {
            console.log(`User ${socket.data.user.name} connected`);
            // Join poll room
            socket.on("join-poll", (pollId) => {
                socket.join(`poll-${pollId}`);
                if (!this.pollRooms.has(pollId)) {
                    this.pollRooms.set(pollId, new Set());
                }
                this.pollRooms.get(pollId).add(socket.id);
                // Notify others about new participant (for lobby)
                socket.to(`poll-${pollId}`).emit("user-joined", {
                    user: socket.data.user,
                    timestamp: new Date(),
                });
            });
            // Leave poll room
            socket.on("leave-poll", (pollId) => {
                socket.leave(`poll-${pollId}`);
                if (this.pollRooms.has(pollId)) {
                    this.pollRooms.get(pollId).delete(socket.id);
                }
                socket.to(`poll-${pollId}`).emit("user-left", {
                    user: socket.data.user,
                    timestamp: new Date(),
                });
            });
            // Handle live answer selection
            socket.on("select-answer", (data) => {
                // Broadcast to poll room (for real-time stats)
                socket.to(`poll-${data.pollId}`).emit("answer-selected", {
                    userId: socket.data.user.id,
                    questionId: data.questionId,
                    optionIndex: data.optionIndex,
                    timestamp: new Date(),
                });
            });
            socket.on("disconnect", () => {
                console.log(`User ${socket.data.user.name} disconnected`);
                // Clean up from all poll rooms
                this.pollRooms.forEach((participants, pollId) => {
                    if (participants.has(socket.id)) {
                        participants.delete(socket.id);
                        socket.to(`poll-${pollId}`).emit("user-left", {
                            user: socket.data.user,
                            timestamp: new Date(),
                        });
                    }
                });
            });
        });
    }
    // Methods for services to emit events
    broadcastPollStatusChange(pollId, status, data) {
        this.io.to(`poll-${pollId}`).emit("poll-status-changed", {
            pollId,
            status,
            data,
            timestamp: new Date(),
        });
    }
    broadcastPollStats(pollId, stats) {
        this.io.to(`poll-${pollId}`).emit("poll-stats-updated", {
            pollId,
            stats,
            timestamp: new Date(),
        });
    }
    notifyUserKicked(pollId, userId) {
        // Find socket for this user and disconnect them from poll
        const sockets = this.io.sockets.sockets;
        for (const [, socket] of sockets) {
            if (socket.data.user?.id === userId) {
                socket.leave(`poll-${pollId}`);
                socket.emit("kicked-from-poll", { pollId });
                break;
            }
        }
    }
    getServer() {
        return this.io;
    }
}
exports.SocketService = SocketService;
let socketService = null;
const initializeSocketService = (server) => {
    if (!socketService) {
        socketService = new SocketService(server);
    }
    return socketService;
};
exports.initializeSocketService = initializeSocketService;
const getSocketService = () => {
    if (!socketService) {
        throw new Error("SocketService not initialized. Call initializeSocketService first.");
    }
    return socketService;
};
exports.getSocketService = getSocketService;
//# sourceMappingURL=socketService.js.map