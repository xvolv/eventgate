import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);

  if (!email || !email.includes("@")) {
    return NextResponse.json({ kind: "none", options: [] }, { status: 200 });
  }

  const systemGrant = await prisma.systemRoleGrant.findFirst({
    where: { email },
    select: { role: true },
  });

  if (systemGrant) {
    return NextResponse.json(
      { kind: "reviewer", options: [] },
      { status: 200 }
    );
  }

  const clubGrants = await prisma.clubRoleGrant.findMany({
    where: { email },
    select: {
      clubId: true,
      role: true,
      club: { select: { name: true } },
    },
    orderBy: [{ club: { name: "asc" } }],
  });

  if (clubGrants.length === 0) {
    return NextResponse.json({ kind: "none", options: [] }, { status: 200 });
  }

  return NextResponse.json(
    {
      kind: "club_lead",
      options: clubGrants.map((g) => ({
        clubId: g.clubId,
        clubName: g.club.name,
        role: g.role,
      })),
    },
    { status: 200 }
  );
}
