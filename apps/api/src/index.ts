import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { checkDb } from "./db.js";

//Import routes
import authRoutes from "./routes/authRoutes.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const app = express();
app.use(cors());

// HTML hello world
app.get("/", (_req, res) => {
  res.status(200).type("html").send(`<!doctype html>
<html lang="en">
<head><meta charset="UTF-8" /><title>API Hello</title>
<style>body{font-family:system-ui;margin:2rem}</style></head>
<body>
  <h1>NWU Live Poll API: Hello World</h1>
  <p>Express at <code>/</code>. Try <a href="/api/health">/api/health</a>.</p>
</body>
</html>`);
});

app.get("/api/health", async (_req, res) => {
  const dbOk = await checkDb();
  res.json({ ok: true, uptime: process.uptime(), db: dbOk ? "up" : "down" });
});

//API route
app.use("/api/auth", authRoutes);

//API root endpoint
app.get("/api", (_req, res) => {
  res.json({
    message: "NWU Live Poll API v1.0.0",
    documentation: "Visit / for endpoint documentation",
    endpoints: {
      auth: "/api/auth"
    }

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.emit("hello", { msg: "socket.io connected" });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on 0.0.0.0:${PORT}`);
});
