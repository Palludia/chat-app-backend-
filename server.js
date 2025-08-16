require("dotenv").config();

const { MongoClient } = require("mongodb");
const express = require("express");
const app = express();
const PORT = 3001;
const cors = require("cors");
const uri = process.env.MONGODB_URI;

let client;
let db;
let messageCollection;

async function connectDB() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    db = client.db("chatapp");
    messageCollection = db.collection("messages");
    await client.db("chatapp").command({ ping: 1 });
    // Starting the server
    app.listen(PORT, () => {
      console.log(`Backend is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB: ", error);
    process.exit(1);
  }
}

connectDB();
// Use cors to connect to frontend
app.use(cors()); // Allowing all origins

// Middleware allow express to parse json
app.use(express.json());

// simple route to test if server works
app.get("/", (req, res) => {
  res.send("HELLO FROM EXPRESS!");
});

app
  .route("/api/messages")
  .get(async (req, res) => {
    try {
      const message = await messageCollection.find().toArray();
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  })
  .post(async (req, res) => {
    const { text, username } = req.body;

    if (!text || !username) {
      return res.status(400).json({ error: "Text and username are required" });
    }

    const newMessage = {
      text,
      username,
      timeStamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    try {
      const sentMessage = await messageCollection.insertOne(newMessage);
      res.status(201).json({ ...newMessage, _id: sentMessage.insertedId });
    } catch (error) {
      res.status(500).json({ error: "Failed to save message" });
    }
  });
