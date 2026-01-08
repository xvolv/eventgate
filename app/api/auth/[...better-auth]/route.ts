import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function isSignupAllowed(email: string) {
  if (!email || !email.includes("@")) return false;

  const [clubGrant, systemGrant] = await Promise.all([
    prisma.clubRoleGrant.findFirst({ where: { email } }),
    prisma.systemRoleGrant.findFirst({ where: { email } }),
  ]);

  return Boolean(clubGrant || systemGrant);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();

  // better-auth email signup endpoint is expected to contain "sign-up".
  // We enforce allowlisted signup for any sign-up request.
  if (path.includes("sign-up")) {
    const cloned = request.clone();
    const body = await cloned.json().catch(() => null);

    const email = normalizeEmail(body?.email);
    const allowed = await isSignupAllowed(email);

    if (!allowed) {
      return NextResponse.json(
        {
          message:
            "Registration is restricted. Your email is not registered as a club lead or reviewer. Please contact the Student Activities Office to be added.",
          code: "SIGNUP_NOT_ALLOWED",
        },
        { status: 403 }
      );
    }
  }

  return handler.POST(request);
}
