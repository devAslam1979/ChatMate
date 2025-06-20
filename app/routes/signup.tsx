import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { db } from "../utils/db.server";
import AuthForm from "../components/AuthForm";
import bcrypt from "bcryptjs";

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const name = form.get("name")?.toString().trim() || "";
  const email = form.get("email")?.toString().trim() || "";
  const password = form.get("password")?.toString() || "";

  const errors: { [key: string]: string } = {};

  if (!name) errors.name = "Name is required";
  if (!email) errors.email = "Email is required";
  if (!password) errors.password = "Password is required";

  if (Object.keys(errors).length > 0) {
    return json(errors, { status: 400 });
  }
  const hashed = await bcrypt.hash(password, 10);
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return json(
      { email: "A user with this email already exists" },
      { status: 400 }
    );
  }

  // Save the user
  await db.user.create({
    data: {
      name,
      email,
      password:hashed, // NOTE: You should hash this in production
    },
  });

  return redirect("/login");
};

export default function Signup() {
  return <AuthForm title="Sign Up" buttonText="Register" showNameField />;
}
