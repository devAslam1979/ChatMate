import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import  {getUserSession}  from "../utils/session.server";
import { PrismaClient } from "@prisma/client";
import { Chat } from "../components/Chat";

const prisma = new PrismaClient();

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getUserSession(request);
  const userId = session.get("userId");

  if (!userId) {
    return redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return redirect("/login");
  }

  return json({ userId: user.id, name: user.name });
}

export default function Index() {
  const { userId, name } = useLoaderData<typeof loader>();

  return (
    <main style={{ padding: 20 }}>
      <h1>Welcome, {name}</h1>
      <Chat userId={userId} />
    </main>
  );
}
