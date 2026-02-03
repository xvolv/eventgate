import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: proposalId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;

  if (!proposalId) {
    return NextResponse.json(
      { message: "Missing proposal id" },
      { status: 400 },
    );
  }

  if (!user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      { message: "Email verification required" },
      { status: 403 },
    );
  }

  const directorGrant = await prisma.systemRoleGrant.findUnique({
    where: {
      email_role: {
        email: user.email.toLowerCase(),
        role: "DIRECTOR",
      },
    },
  });

  if (!directorGrant) {
    return NextResponse.json(
      { message: "Only Directors can delete proposals" },
      { status: 403 },
    );
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { id: true },
  });

  if (!proposal) {
    return NextResponse.json(
      { message: "Proposal not found" },
      { status: 404 },
    );
  }

  await prisma.proposal.delete({ where: { id: proposalId } });

  return NextResponse.json({ message: "Proposal deleted" });
}
