import { createCookieSessionStorage, redirect } from "@remix-run/node";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secrets: ["your-secret-key"], // Replace with secure secret
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
});

const USER_SESSION_KEY = "userId";

export async function getUserSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request): Promise<string | null> {
  const session = await getUserSession(request);
  const userId = session.get(USER_SESSION_KEY);
  return typeof userId === "string" ? userId : null;
}

export async function requireUserId(request: Request): Promise<string> {
  const userId = await getUserId(request);
  if (!userId) throw redirect("/login");
  return userId;
}

export async function createUserSession(userId: number, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set(USER_SESSION_KEY, userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
