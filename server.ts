import { WebSocketServer, WebSocket, RawData } from "ws";
import express from "express";
import { PrismaClient } from "@prisma/client";
import http from "http";
import bodyParser from "body-parser";

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3001;

// Keep track of connections and their current conversation
type ClientInfo = {
  ws: WebSocket;
  conversationId?: string;
};

const clients = new Set<ClientInfo>();

console.log(`✅ WebSocket server is running on ws://localhost:${PORT}`);

// Handle WebSocket connections
wss.on("connection", (ws: WebSocket) => {
  const clientInfo: ClientInfo = { ws };
  clients.add(clientInfo);
  console.log("🔗 New client connected");

  ws.on("message", async (data: RawData) => {
    try {
      const msg = JSON.parse(data.toString());

      // Join conversation room
      if (msg.type === "join") {
        clientInfo.conversationId = msg.conversationId;
        return;
      }

      // Send message
      if (msg.type === "message") {
        const saved = await prisma.message.create({
          data: {
            content: msg.content,
            senderId: msg.userId,
            conversationId: msg.conversationId,
          },
          include: { sender: true },
        });

        // Broadcast only to clients in the same conversation
        clients.forEach((client) => {
          if (
            client.ws.readyState === WebSocket.OPEN &&
            client.conversationId === msg.conversationId
          ) {
            client.ws.send(JSON.stringify({ type: "message", message: saved }));
          }
        });

        console.log("📤 Message sent in conversation:", msg.conversationId);
      }
    } catch (err) {
      console.error("❌ Error handling WebSocket message:", err);
    }
  });

  ws.on("close", () => {
    clients.delete(clientInfo);
    console.log("❎ Client disconnected");
  });
});

// Broadcast route for new conversation creation
app.use(bodyParser.json());

app.post("/broadcast", (req, res) => {
  const { type, conversationId, users } = req.body;

  if (type === "new_conversation") {
    const payload = JSON.stringify({ type, conversationId, users });

    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });

    console.log("📡 New conversation broadcasted:", conversationId);
  }

  res.sendStatus(200);
});

// Start HTTP server
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
