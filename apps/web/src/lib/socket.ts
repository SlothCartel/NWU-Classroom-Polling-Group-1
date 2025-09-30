import { io, Socket } from "socket.io-client";
import { getToken } from "./auth";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const serverBase = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/api$/, "");
  socket = io(serverBase, { auth: { token: getToken() || "" }, transports: ["websocket"] });
  return socket;
}

export const joinPollRoom = (pollId: string | number) => getSocket().emit("join-poll", String(pollId));
export const leavePollRoom = (pollId: string | number) => getSocket().emit("leave-poll", String(pollId));
export const sendLiveSelection = (pollId: string | number, questionId: number, optionIndex: number) =>
  getSocket().emit("select-answer", { pollId, questionId, optionIndex });
