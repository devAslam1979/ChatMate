import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { commitSession, getSession } from "../utils/session.server";

const prisma = new PrismaClient();

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = form.get("email")?.toString() || "";
  const password = form.get("password")?.toString() || "";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", user.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Login() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Login</h1>
      <Form method="post">
        <input name="email" type="email" placeholder="Email" required />
        <br />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
        />
        <br />
        <button type="submit">Login</button>
      </Form>
    </main>
  );
}
