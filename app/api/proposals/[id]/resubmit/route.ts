import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RESUBMITTABLE_STATUSES = new Set([
  "LEAD_REJECTED",
  "SU_REJECTED",
  "DIRECTOR_REJECTED",
  "RESUBMISSION_REQUIRED",
]);

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
      { message: "Only club presidents can resubmit proposals" },
      { status: 403 }
    );
  }

  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      clubId: presidentGrant.clubId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!proposal) {
    return NextResponse.json(
      { message: "Proposal not found" },
      { status: 404 }
    );
  }

  if (!RESUBMITTABLE_STATUSES.has(proposal.status)) {
    return NextResponse.json(
      { message: "This proposal cannot be resubmitted at its current stage" },
      { status: 403 }
    );
  }

  const nextStatus =
    proposal.status === "LEAD_REJECTED" ? "LEAD_REVIEW" : "PENDING";

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (proposal.status === "LEAD_REJECTED") {
        await tx.proposalLeadApproval.updateMany({
          where: { proposalId },
          data: {
            approved: false,
            comments: null,
          },
        });
      }

      return tx.proposal.update({
        where: { id: proposalId },
        data: {
          status: nextStatus,
          resubmissionCount: { increment: 1 },
        },
        include: {
          event: true,
          contacts: true,
          collaborators: true,
          guests: true,
          leadApprovals: true,
          reviews: true,
          club: { select: { name: true } },
        },
      });
    });

    return NextResponse.json({
      message: "Proposal resubmitted",
      proposal: updated,
    });
  } catch (error) {
    console.error("Proposal resubmit error:", error);
    const detail = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { message: detail || "Failed to resubmit proposal" },
      { status: 500 }
    );
  }
}
