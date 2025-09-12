import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

export default function App() {
  const [health, setHealth] = useState<string>("checking...");
  const [socketMsg, setSocketMsg] = useState<string>("(waiting)");

  useEffect(() => {
    axios.get("/api/health").then(r => setHealth(JSON.stringify(r.data)));
    const socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
    socket.on("hello", (p: any) => setSocketMsg(p.msg));
    return () => socket.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 rounded-2xl shadow bg-white max-w-lg w-full">
        <h1 className="text-3xl font-bold mb-3">Hello World (Frontend)</h1>
        <p className="mb-2">React + Vite + Tailwind.</p>
        <p className="mb-2">API /api/health → <code>{health}</code></p>
        <p>Socket.io: <code>{socketMsg}</code></p>
      </div>
    </div>
  );
}
