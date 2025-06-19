import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { commitSession, getSession } from "../utils/session.server";

const prisma = new PrismaClient();

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const name = form.get("name")?.toString() || "";
  const email = form.get("email")?.toString() || "";
  const password = form.get("password")?.toString() || "";

  if (!name || !email || !password) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return json({ error: "User already exists" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", user.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Signup() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Sign Up</h1>
      <Form method="post">
        <input name="name" placeholder="Name" required />
        <br />
        <input name="email" type="email" placeholder="Email" required />
        <br />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
        />
        <br />
        <button type="submit">Register</button>
      </Form>
    </main>
  );
}
