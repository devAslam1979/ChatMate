import { useEffect, useRef, useState } from "react";
import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { requireUserId } from "../utils/session.server";
import { db } from "../utils/db.server";
import { useLoaderData } from "@remix-run/react";
import { Header } from "../components/Header";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return redirect("/login");

  const messages = await db.message.findMany({
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return json({ userId, userEmail: user.email, messages });
};

export default function ChatPage() {
  const { userId, userEmail, messages } = useLoaderData<typeof loader>();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [chatMessages, setChatMessages] = useState(messages);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setChatMessages((prev) => [...prev, msg]);
    };
    setSocket(ws);
    return () => ws.close();
  }, []);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages]);

  const sendMessage = () => {
    const content = inputRef.current?.value;
    if (content && socket) {
      socket.send(JSON.stringify({ content, userId }));
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-4">
      <Header email={userEmail} />
      <div
        ref={chatBoxRef}
        className="h-[500px] overflow-y-auto border rounded-md p-4 bg-gray-50 shadow-inner"
      >
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-3 max-w-[70%] ${
              msg.userId === userId ? "ml-auto text-right" : "text-left"
            }`}
          >
            <p className="text-sm text-gray-600">
              {msg.user?.name ?? msg.user?.email ?? "Unknown"}
            </p>
            <div
              className={`inline-block px-4 py-2 rounded-xl ${
                msg.userId === userId
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 border rounded px-3 py-2 shadow-sm"
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
