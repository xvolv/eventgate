import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const CLUB_ROLES = new Set(["PRESIDENT", "VP", "SECRETARY"] as const);

type ClubRole = "PRESIDENT" | "VP" | "SECRETARY";

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const body = await request.json().catch(() => null);
  const clubId = typeof body?.clubId === "string" ? body.clubId : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body?.role === "string" ? body.role : "";

  if (!clubId) {
    return NextResponse.json(
      { message: "clubId is required" },
      { status: 400 }
    );
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { message: "Valid email is required" },
      { status: 400 }
    );
  }
  if (!CLUB_ROLES.has(role as ClubRole)) {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }

  const grant = await prisma.clubRoleGrant.upsert({
    where: { clubId_role: { clubId, role: role as ClubRole } },
    update: { email },
    create: { clubId, role: role as ClubRole, email },
  });

  return NextResponse.json({ grant }, { status: 201 });
}
