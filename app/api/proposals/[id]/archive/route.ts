import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;

  if (!proposalId) {
    return NextResponse.json(
      { message: "Missing proposal id" },
      { status: 400 }
    );
  }

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
      { message: "Only club presidents can archive proposals" },
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

  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      clubId: presidentGrant.clubId,
    },
    select: { id: true, archivedAt: true },
  });

  if (!proposal) {
    return NextResponse.json(
      { message: "Proposal not found" },
      { status: 404 }
    );
  }

  if (proposal.archivedAt) {
    return NextResponse.json({ message: "Proposal already archived" });
  }

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { archivedAt: new Date() },
  });

  return NextResponse.json({ message: "Proposal archived", proposal: updated });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;

  if (!proposalId) {
    return NextResponse.json(
      { message: "Missing proposal id" },
      { status: 400 }
    );
  }

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
      { message: "Only club presidents can restore proposals" },
      { status: 403 }
    );
  }

  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      clubId: presidentGrant.clubId,
    },
    select: { id: true, archivedAt: true },
  });

  if (!proposal) {
    return NextResponse.json(
      { message: "Proposal not found" },
      { status: 404 }
    );
  }

  if (!proposal.archivedAt) {
    return NextResponse.json({ message: "Proposal is not archived" });
  }

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { archivedAt: null },
  });

  return NextResponse.json({ message: "Proposal restored", proposal: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;

  if (!proposalId) {
    return NextResponse.json(
      { message: "Missing proposal id" },
      { status: 400 }
    );
  }

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
      { message: "Only club presidents can delete proposals" },
      { status: 403 }
    );
  }

  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      clubId: presidentGrant.clubId,
    },
    select: { id: true, archivedAt: true },
  });

  if (!proposal) {
    return NextResponse.json(
      { message: "Proposal not found" },
      { status: 404 }
    );
  }

  if (!proposal.archivedAt) {
    return NextResponse.json(
      { message: "You can only permanently delete archived proposals" },
      { status: 403 }
    );
  }

  await prisma.proposal.delete({ where: { id: proposalId } });

  return NextResponse.json({ message: "Proposal deleted permanently" });
}
