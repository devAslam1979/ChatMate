import { Form } from "@remix-run/react";

interface HeaderProps {
  name?: string;
  email: string;
}

export function Header({ name, email }: HeaderProps) {
  return (
    <header className="bg-white border-b shadow-sm p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-full text-lg font-bold">
          {name ? name[0].toUpperCase() : email[0].toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-gray-800">{name ?? email}</p>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
      </div>

      <Form method="post" action="/logout">
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-sm transition"
          type="submit"
        >
          Logout
        </button>
      </Form>
    </header>
  );
}
