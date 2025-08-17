// backend/server.js
require("dotenv").config();

const { MongoClient } = require("mongodb");
const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 3001;
const uri = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let messageCollection;

async function connectDB() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB Atlas 🌐");
    const db = client.db("chatapp");
    messageCollection = db.collection("messages");
    await db.command({ ping: 1 });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

connectDB();

// REST API routes - Only keep the GET route for initial messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await messageCollection.find().toArray();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Add this route to your backend file
app.get("/", (req, res) => {
  res.send("Backend is running.");
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.IO logic
io.on("connection", async (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for new messages
  socket.on("chat message", async (msg) => {
    // Add timestamp on the backend for consistency
    const newMessage = {
      ...msg,
      timeStamp: new Date().toISOString(),
    };

    try {
      await messageCollection.insertOne(newMessage);
      io.emit("chat message", newMessage); // Broadcast to all clients
    } catch (err) {
      console.error("Failed to save message:", err);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
