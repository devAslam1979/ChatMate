import { Form } from "@remix-run/react";
import { clear } from "console";

export function Header({ email }: { email: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-100 shadow">
      <p className="text-lg font-semibold">Welcome, {email}</p>
      <Form method="POST" action="/logout">
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
          Logout
        </button>
      </Form>
    </div>
  );
}
