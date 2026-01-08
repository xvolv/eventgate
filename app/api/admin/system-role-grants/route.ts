import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const SYSTEM_ROLES = new Set(["ADMIN", "DIRECTOR", "STUDENT_UNION"] as const);

type SystemRole = "ADMIN" | "DIRECTOR" | "STUDENT_UNION";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeRole(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const rawPage = searchParams.get("page");
  const q = normalizeEmail(searchParams.get("q")) || "";

  const page = Math.max(Number.parseInt(rawPage || "1", 10) || 1, 1);
  const pageSize = 10;

  const roleCandidate = (q || "").toUpperCase();
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ...(SYSTEM_ROLES.has(roleCandidate as SystemRole)
            ? [{ role: roleCandidate as SystemRole }]
            : []),
        ],
      }
    : {};

  const [total, grants] = await Promise.all([
    prisma.systemRoleGrant.count({ where }),
    prisma.systemRoleGrant.findMany({
      where,
      orderBy: [{ role: "asc" }, { email: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ grants, total, page, pageSize });
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const role = normalizeRole(body?.role);

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

export async function PUT(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const email = normalizeEmail(body?.email);
  const role = normalizeRole(body?.role);

  if (!id) {
    return NextResponse.json(
      { message: "Grant id is required" },
      { status: 400 }
    );
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { message: "Valid email is required" },
      { status: 400 }
    );
  }
  if (!SYSTEM_ROLES.has(role as SystemRole)) {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }

  try {
    const grant = await prisma.systemRoleGrant.update({
      where: { id },
      data: { email, role: role as SystemRole },
    });

    return NextResponse.json({ grant });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json(
          { message: "Grant not found" },
          { status: 404 }
        );
      }
      if (err.code === "P2002") {
        return NextResponse.json(
          { message: "A grant with that email and role already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to update grant" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";

  if (!id) {
    return NextResponse.json(
      { message: "Grant id is required" },
      { status: 400 }
    );
  }

  try {
    const grant = await prisma.systemRoleGrant.delete({ where: { id } });
    return NextResponse.json({ grant });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json(
          { message: "Grant not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to delete grant" },
      { status: 500 }
    );
  }
}
