import { createAuthClient } from "better-auth/react";

const runtimeBaseUrl =
  // Prefer the current origin in the browser so production uses the deployed domain,
  // and fall back to env when rendering on the server.
  (typeof window !== "undefined" ? window.location.origin : undefined) ||
  process.env.NEXT_PUBLIC_APP_URL;

export const authClient = createAuthClient({});

export const { signIn, signUp, signOut, getSession, useSession } = authClient;
