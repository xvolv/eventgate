import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, requireAdmin } from "@/lib/admin-auth";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
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
  const pageSize = 20;

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
      },
    }),
  ]);

  const emails = users.map((u) => u.email.toLowerCase());
  const grants = emails.length
    ? await prisma.systemRoleGrant.findMany({
        where: { email: { in: emails } },
        select: { email: true, role: true },
      })
    : [];

  const rolesByEmail = new Map<string, string[]>();
  for (const g of grants) {
    const key = g.email.toLowerCase();
    const existing = rolesByEmail.get(key);
    if (existing) {
      existing.push(String(g.role));
    } else {
      rolesByEmail.set(key, [String(g.role)]);
    }
  }

  const usersWithRoles = users.map((u) => ({
    ...u,
    roles: rolesByEmail.get(u.email.toLowerCase()) || [],
  }));

  return NextResponse.json({ users: usersWithRoles, total, page, pageSize });
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const session = await getSessionFromRequest(request);
  const currentEmail = session?.user?.email
    ? session.user.email.toLowerCase()
    : null;

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";

  if (!userId) {
    return NextResponse.json(
      { message: "userId is required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  if (currentEmail && user.email.toLowerCase() === currentEmail) {
    return NextResponse.json(
      { message: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
