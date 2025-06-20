import { Form } from "@remix-run/react";

type Props = {
  title: string;
  buttonText: string;
  showNameField?: boolean;
  errors?: { [key: string]: string };
};

export default function AuthForm({
  title,
  buttonText,
  showNameField = false,
  errors = {},
}: Props) {
  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-lg">
      <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
        {title}
      </h2>
      <Form method="post" className="space-y-5">
        {showNameField && (
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </div>
        {errors.form && (
          <p className="text-center text-red-600 text-sm font-medium">
            {errors.form}
          </p>
        )}
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          {buttonText}
        </button>
      </Form>
    </div>
  );
}
