import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
export declare class SocketService {
    private io;
    private pollRooms;
    constructor(server: HTTPServer);
    private setupMiddleware;
    private setupEventHandlers;
    broadcastPollStatusChange(pollId: string, status: string, data?: any): void;
    broadcastPollStats(pollId: string, stats: any): void;
    notifyUserKicked(pollId: string, userId: number): void;
    getServer(): SocketIOServer;
}
export declare const initializeSocketService: (server: HTTPServer) => SocketService;
export declare const getSocketService: () => SocketService;
//# sourceMappingURL=socketService.d.ts.map