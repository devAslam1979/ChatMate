import { WebSocketServer, WebSocket, RawData } from "ws";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

console.log(`✅ WebSocket server is running on ws://localhost:${PORT}`);

wss.on("connection", (ws: WebSocket) => {
  console.log("🔗 New client connected");

  ws.on("message", async (data: RawData) => {
    try {
      console.log("📩 Message received:", data.toString());
      const msg = JSON.parse(data.toString());

      const saved = await prisma.message.create({
        data: {
          content: msg.content,
          userId: msg.userId,
        },
        include: { user: true },
      });

      console.log("💾 Message saved to DB:", saved);

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(saved));
        }
      });

      console.log("📤 Message broadcasted to clients");
    } catch (err) {
      console.error("❌ Message handling error:", err);
    }
  });

  ws.on("close", () => {
    console.log("❎ Client disconnected");
  });
});
