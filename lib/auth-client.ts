import { createAuthClient } from "better-auth/react";

const runtimeBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined" ? window.location.origin : undefined);

export const authClient = createAuthClient({
  baseURL: runtimeBaseUrl,
});

export const { signIn, signUp, signOut, getSession, useSession } = authClient;
