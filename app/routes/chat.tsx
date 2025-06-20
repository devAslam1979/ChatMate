import { useEffect, useState } from "react";
import { Form, Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { db } from "../utils/db.server";
import { requireUserId } from "../utils/session.server";
import { Header } from "../components/Header";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { conversations: { include: { users: true } } },
  });

  const otherUsers = await db.user.findMany({
    where: { id: { not: userId } },
    select: { id: true, name: true, email: true },
  });

  return json({
    userId,
    user: { name: user?.name, email: user?.email },
    conversations: user?.conversations ?? [],
    otherUsers,
  });
};

export default function ChatStartPage() {
  const { conversations, otherUsers, userId, user } =
    useLoaderData<typeof loader>();
  const [liveConversations, setLiveConversations] = useState(conversations);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.type === "new_conversation") {
        setLiveConversations((prev) => {
          const convExists = prev.some((c) => c.id === update.conversationId);
          if (convExists) return prev;
          return [
            {
              id: update.conversationId,
              users: update.users,
            },
            ...prev,
          ];
        });
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Header name={user?.name ?? undefined} email={user.email} />
      <h1 className="text-3xl font-bold my-6 text-center">Messages</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Your Conversations</h2>
        <ul className="space-y-4">
          {liveConversations.map((conv) => {
            const other = conv.users.find((u) => u.id !== userId);
            return (
              <li key={conv.id} className="border p-4 rounded-lg shadow">
                <Link
                  to={`/conversation/${conv.id}`} // ✅ make sure this matches your route folder
                  className="text-blue-600 hover:underline font-medium"
                >
                  Chat with {other?.name || other?.email}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Start New Chat</h2>
        <ul className="space-y-2">
          {otherUsers.map((user) => (
            <li
              key={user.id}
              className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
            >
              <span>{user.name || user.email}</span>
              <Form method="post">
                <input type="hidden" name="receiverId" value={user.id} />
                <button
                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                  type="submit"
                >
                  Start Chat
                </button>
              </Form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const receiverId = formData.get("receiverId") as string;

  const existing = await db.conversation.findFirst({
    where: {
      users: {
        every: {
          id: { in: [userId, receiverId] },
        },
      },
    },
  });

  if (existing) {
    return redirect(`/conversation/${existing.id}`);
  }

  const newConv = await db.conversation.create({
    data: {
      users: {
        connect: [{ id: userId }, { id: receiverId }],
      },
    },
    include: {
      users: true,
    },
  });

  await fetch("http://localhost:3001/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "new_conversation",
      conversationId: newConv.id,
      users: newConv.users,
    }),
  });

  return redirect(`/conversation/${newConv.id}`);
};
