import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const SYSTEM_ROLES = new Set(["ADMIN", "DIRECTOR", "STUDENT_UNION"] as const);

type SystemRole = "ADMIN" | "DIRECTOR" | "STUDENT_UNION";

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const grants = await prisma.systemRoleGrant.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  return NextResponse.json({ grants });
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body?.role === "string" ? body.role : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { message: "Valid email is required" },
      { status: 400 }
    );
  }
  if (!SYSTEM_ROLES.has(role as SystemRole)) {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }

  const grant = await prisma.systemRoleGrant.upsert({
    where: { email_role: { email, role: role as SystemRole } },
    update: {},
    create: { email, role: role as SystemRole },
  });

  return NextResponse.json({ grant }, { status: 201 });
}
