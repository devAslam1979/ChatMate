import  { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types";

export function Chat({ userId }: { userId: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(import.meta.env.VITE_WS_SERVER_URL);


    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ Connected to WebSocket server");
    };

    socket.onmessage = (event) => {
      const newMessage: ChatMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.onclose = () => console.log("❎ Disconnected");

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;

    const message = {
      content: input.trim(),
      userId,
    };

    socketRef.current.send(JSON.stringify(message));
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className="chat-message">
            <strong>{msg.user.name}: </strong>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
