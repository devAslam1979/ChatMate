import { useEffect, useRef, useState } from "react";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "../utils/session.server";
import { db } from "../utils/db.server";
import { useLoaderData } from "@remix-run/react";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const messages = await db.message.findMany({
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return json({ userId, messages });
};

export default function ChatPage() {
  const { userId, messages } = useLoaderData<typeof loader>();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [chatMessages, setChatMessages] = useState(messages);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setChatMessages((prev) => [...prev, msg]);
    };
    setSocket(ws);
    return () => ws.close();
  }, []);

  const sendMessage = () => {
    const content = inputRef.current?.value;
    if (content && socket) {
      socket.send(JSON.stringify({ content, userId }));
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="p-4">
      <div className="h-[400px] overflow-y-auto border mb-4 p-2">
        {chatMessages.map((msg) => (
          <p key={msg.id} className="mb-1">
            <strong>{msg.user?.username ?? "Unknown"}:</strong> {msg.content}
          </p>
        ))}
      </div>
      <input
        ref={inputRef}
        className="border p-2 w-full mb-2"
        placeholder="Say something..."
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button
        onClick={sendMessage}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Send
      </button>
    </div>
  );
}
