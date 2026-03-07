import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendProposalStatusEmail } from "@/lib/email";

const RESUBMITTABLE_STATUSES = new Set([
  "LEAD_REJECTED",
  "SU_REJECTED",
  "DIRECTOR_REJECTED",
  "RESUBMISSION_REQUIRED",
]);

export async function POST(
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
      { status: 403 },
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
      { status: 404 },
    );
  }

  if (!RESUBMITTABLE_STATUSES.has(proposal.status)) {
    return NextResponse.json(
      { message: "This proposal cannot be resubmitted at its current stage" },
      { status: 403 },
    );
  }

  const nextStatus = "LEAD_REVIEW";

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.proposalLeadApproval.deleteMany({
        where: { proposalId },
      });

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

    const leadGrants = await prisma.clubRoleGrant.findMany({
      where: {
        clubId: presidentGrant.clubId,
        role: { in: ["VP", "SECRETARY"] },
      },
      select: { email: true, role: true },
    });

    // Recreate lead approval tracking entries so the approval count is correct
    if (leadGrants.length > 0) {
      await prisma.proposalLeadApproval.createMany({
        data: leadGrants.map((lead) => ({
          proposalId,
          leadRole: lead.role,
          leadEmail: lead.email,
          approved: false,
        })),
      });
    }

    await Promise.all(
      leadGrants.map((grant) =>
        sendProposalStatusEmail({
          to: grant.email,
          proposalId,
          eventTitle: updated.event?.title || "Untitled Event",
          subject: "EventGate: Proposal resubmitted for lead review",
          heading: "Proposal resubmitted",
          message:
            "A proposal you previously reviewed has been updated and resubmitted. Please review the changes.",
          actionLabel: "Review Proposal",
          actionPath: grant.role === "VP" ? "/vp" : "/secretary",
        }),
      ),
    );

    return NextResponse.json({
      message: "Proposal resubmitted",
      proposal: updated,
    });
  } catch (error) {
    console.error("Proposal resubmit error:", error);
    const detail = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { message: detail || "Failed to resubmit proposal" },
      { status: 500 },
    );
  }
}
