import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;

  if (!user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      { message: "Email verification required" },
      { status: 403 }
    );
  }

  const presidentGrant = await prisma.clubRoleGrant.findFirst({
    where: {
      email: user.email.toLowerCase(),
      role: "PRESIDENT",
    },
    select: { clubId: true },
  });

  if (!presidentGrant) {
    return NextResponse.json(
      { message: "Only club presidents can empty archive" },
      { status: 403 }
    );
  }

  const cutoff = new Date(Date.now() - TWO_DAYS_MS);
  await prisma.proposal.deleteMany({
    where: {
      clubId: presidentGrant.clubId,
      archivedAt: { lt: cutoff },
    },
  });

  const result = await prisma.proposal.deleteMany({
    where: {
      clubId: presidentGrant.clubId,
      archivedAt: { not: null },
    },
  });

  return NextResponse.json({
    message: "Archive emptied",
    deleted: result.count,
  });
}
