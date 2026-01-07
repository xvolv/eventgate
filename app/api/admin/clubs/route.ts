import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
    include: { roleGrants: { orderBy: { role: "asc" } } },
  });

  return NextResponse.json({ clubs });
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const body = await request.json().catch(() => null);
  const clubId = typeof body?.clubId === "string" ? body.clubId.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const presidentEmail =
    typeof body?.presidentEmail === "string"
      ? body.presidentEmail.trim().toLowerCase()
      : "";
  const vpEmail =
    typeof body?.vpEmail === "string" ? body.vpEmail.trim().toLowerCase() : "";
  const secretaryEmail =
    typeof body?.secretaryEmail === "string"
      ? body.secretaryEmail.trim().toLowerCase()
      : "";

  if (!name) {
    return NextResponse.json(
      { message: "Club name is required" },
      { status: 400 }
    );
  }

  if (clubId) {
    const existing = await prisma.club.findUnique({ where: { id: clubId } });
    if (!existing) {
      return NextResponse.json({ message: "Club not found" }, { status: 404 });
    }

    // If renaming, ensure uniqueness.
    if (existing.name !== name) {
      const conflict = await prisma.club.findUnique({ where: { name } });
      if (conflict && conflict.id !== clubId) {
        return NextResponse.json(
          { message: "A club with this name already exists" },
          { status: 409 }
        );
      }
    }
  }

  // Lead emails are optional; validate only when provided.
  if (presidentEmail && !presidentEmail.includes("@")) {
    return NextResponse.json(
      { message: "Invalid presidentEmail" },
      { status: 400 }
    );
  }
  if (vpEmail && !vpEmail.includes("@")) {
    return NextResponse.json({ message: "Invalid vpEmail" }, { status: 400 });
  }
  if (secretaryEmail && !secretaryEmail.includes("@")) {
    return NextResponse.json(
      { message: "Invalid secretaryEmail" },
      { status: 400 }
    );
  }

  const club = await prisma.$transaction(async (tx) => {
    const savedClub = clubId
      ? await tx.club.update({ where: { id: clubId }, data: { name } })
      : await tx.club.upsert({
          where: { name },
          update: {},
          create: { name },
        });

    if (presidentEmail) {
      await tx.clubRoleGrant.upsert({
        where: { clubId_role: { clubId: savedClub.id, role: "PRESIDENT" } },
        update: { email: presidentEmail },
        create: {
          clubId: savedClub.id,
          role: "PRESIDENT",
          email: presidentEmail,
        },
      });
    } else {
      await tx.clubRoleGrant.deleteMany({
        where: { clubId: savedClub.id, role: "PRESIDENT" },
      });
    }

    if (vpEmail) {
      await tx.clubRoleGrant.upsert({
        where: { clubId_role: { clubId: savedClub.id, role: "VP" } },
        update: { email: vpEmail },
        create: { clubId: savedClub.id, role: "VP", email: vpEmail },
      });
    } else {
      await tx.clubRoleGrant.deleteMany({
        where: { clubId: savedClub.id, role: "VP" },
      });
    }

    if (secretaryEmail) {
      await tx.clubRoleGrant.upsert({
        where: { clubId_role: { clubId: savedClub.id, role: "SECRETARY" } },
        update: { email: secretaryEmail },
        create: {
          clubId: savedClub.id,
          role: "SECRETARY",
          email: secretaryEmail,
        },
      });
    } else {
      await tx.clubRoleGrant.deleteMany({
        where: { clubId: savedClub.id, role: "SECRETARY" },
      });
    }

    return tx.club.findUniqueOrThrow({
      where: { id: savedClub.id },
      include: { roleGrants: { orderBy: { role: "asc" } } },
    });
  });

  return NextResponse.json({ club }, { status: 201 });
}
