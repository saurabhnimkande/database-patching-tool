import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import apiRouter from "./routes/apiRouter.js";

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api", apiRouter);

// Handle socket connections
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("join", (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room ${room}`);
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3123;
server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

export { io };
