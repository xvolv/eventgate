import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        {
          message: "Email is required.",
          code: "EMAIL_REQUIRED",
        },
        { status: 400 }
      );
    }

    const systemGrant = await prisma.systemRoleGrant.findFirst({
      where: { email },
      select: { role: true },
    });

    // Reviewers (admin/director/student union) do not need club selection.
    if (systemGrant) {
      return handler.POST(request);
    }

    const clubGrants = await prisma.clubRoleGrant.findMany({
      where: { email },
      select: { clubId: true, role: true },
    });

    if (clubGrants.length === 0) {
      return NextResponse.json(
        {
          message:
            "Registration is restricted. Please contact the Student Activities Office to be added.",
          code: "SIGNUP_NOT_ALLOWED",
        },
        { status: 403 }
      );
    }

    const clubId = normalizeString(body?.clubId);
    const clubRole = normalizeString(body?.clubRole).toUpperCase();

    if (!clubId || !clubRole) {
      return NextResponse.json(
        {
          message:
            "Registration is restricted. Please contact the Student Activities Office to be added.",
          code: "CLUB_SELECTION_REQUIRED",
        },
        { status: 400 }
      );
    }

    const match = clubGrants.some(
      (g) => g.clubId === clubId && String(g.role) === clubRole
    );

    if (!match) {
      return NextResponse.json(
        {
          message:
            "Registration is restricted. Please contact the Student Activities Office to be added.",
          code: "CLUB_SELECTION_MISMATCH",
        },
        { status: 403 }
      );
    }
  }

  return handler.POST(request);
}
