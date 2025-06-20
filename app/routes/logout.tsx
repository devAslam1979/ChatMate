// routes/logout.tsx
import type { LoaderFunction, ActionFunctionArgs } from "@remix-run/node";
import { logout } from "../utils/session.server";

// Handle GET requests (e.g. via <a href="/logout">)
export const loader: LoaderFunction = async ({ request }) => {
  return logout(request);
};

// Handle POST requests (e.g. via <form method="post" action="/logout">)
export const action = async ({ request }: ActionFunctionArgs) => {
  return logout(request);
};
