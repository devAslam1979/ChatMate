import { useEffect, useRef, useState } from "react";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { db } from "../utils/db.server";
import { requireUserId } from "../utils/session.server";
import { Header } from "../components/Header";

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const { conversationId } = params;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

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

  return json({ userId, conversation, user });
};

export default function ChatRoom() {
  const { userId, conversation, user } = useLoaderData<typeof loader>();
  const [messages, setMessages] = useState(conversation.messages);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");
    setSocket(ws);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          conversationId: conversation.id,
        })
      );
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (
        msg.type === "message" &&
        msg.message.conversationId === conversation.id
      ) {
        setMessages((prev) => [...prev, msg.message]);
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
      <Header name={user?.name} email={user.email} />
      <div className="flex justify-between items-center my-4">
        <h2 className="text-2xl font-semibold">
          Chat with{" "}
          {conversation.users.find((u) => u.id !== userId)?.name ??
            "Unknown User"}
        </h2>
        <Link
          to="/chat"
          className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded"
        >
          All Chats
        </Link>
      </div>

      <div
        ref={chatBoxRef}
        className="h-[450px] overflow-y-auto bg-gray-100 p-4 rounded-lg shadow-inner mb-6"
      >
        {messages.map((msg) => {
          const isSelf = msg.senderId === userId;
          return (
            <div
              key={msg.id}
              className={`mb-4 max-w-[80%] ${
                isSelf ? "ml-auto text-right" : "text-left"
              }`}
            >
              <p className="text-xs text-gray-500 mb-1">
                {isSelf ? "You" : msg.sender?.name || msg.sender?.email}
              </p>
              <div
                className={`inline-block px-4 py-2 rounded-xl ${
                  isSelf
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-800 border"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
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
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
