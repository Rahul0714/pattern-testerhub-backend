const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const connectDB = require("./config/db");
const fileUpload = require("express-fileupload");
const authRoutes = require("./routes/auth");
const patternRoutes = require("./routes/pattern");
const chatRoutes = require("./routes/chat");
const Chat = require("./models/chat");
const recommendationRoutes = require("./routes/recommendation"); // Adjust path as needed

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

connectDB();
app.use(express.json());
app.use(fileUpload({ useTempFiles: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/pattern", patternRoutes);
app.use("/api/chat", chatRoutes(io, Chat));
recommendationRoutes(app);

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url} - Body:`, req.body);
  next();
});

const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
  console.log("Socket.IO: User connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Socket.IO: User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
