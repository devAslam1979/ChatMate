import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { db } from "../utils/db.server";
import bcrypt from "bcryptjs";
// import { createUserSession } from "../utils/session.server";
import AuthForm from "../components/AuthForm";

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const email = form.get("email")?.toString();
  const password = form.get("password")?.toString();

  if (!email || !password) {
    return json({ form: "Both fields are required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return json({ form: "Invalid credentials" }, { status: 401 });
  }
redirect("/xyz");
  // return createUserSession(user.id, "/chat");
};

export default function LoginPage() {
  // const errors = useActionData<typeof action>();

  return <AuthForm title="Login" buttonText="Sign In" errors={{}} showNameField={false} />;
}
