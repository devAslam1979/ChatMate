import { useEffect, useRef, useState } from "react";
import { useLoaderData } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { requireUserId } from "../utils/session.server";
import { db } from "../utils/db.server";

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const { conversationId } = params;

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      users: true,
      messages: {
        include: { sender: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) return redirect("/chat");

  return json({ userId, conversation });
};

export default function ChatRoom() {
  const { userId, conversation } = useLoaderData<typeof loader>();
  const [messages, setMessages] = useState(conversation.messages);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");
    setSocket(ws);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.conversationId === conversation.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    return () => ws.close();
  }, [conversation.id]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = () => {
    const content = inputRef.current?.value.trim();
    if (content && socket) {
      socket.send(
        JSON.stringify({
          type: "message",
          content,
          userId,
          conversationId: conversation.id,
        })
      );
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-semibold text-center mb-4">
        Chat with {conversation.users.find((u) => u.id !== userId)?.name}
      </h2>

      <div
        ref={chatBoxRef}
        className="h-[500px] overflow-y-auto bg-gray-100 p-4 rounded-lg shadow-inner mb-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-3 max-w-[70%] ${
              msg.userId === userId ? "ml-auto text-right" : "text-left"
            }`}
          >
            <p className="text-xs text-gray-500">
              {msg.user?.name || msg.user?.email || "Unknown"}
            </p>
            <div
              className={`inline-block px-4 py-2 rounded-xl ${
                msg.userId === userId
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 border"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 border rounded px-3 py-2 shadow-sm"
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
