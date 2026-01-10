import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendProposalStatusEmail } from "@/lib/email";

export async function POST(request: Request) {
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

  try {
    const body = await request.json();
    const { proposalId, approved, comments, leadRole } = body;

    if (!proposalId || typeof approved !== "boolean" || !leadRole) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user is authorized to approve this proposal
    const leadGrant = await prisma.clubRoleGrant.findFirst({
      where: {
        email: user.email.toLowerCase(),
        role: leadRole,
      },
      include: {
        club: true,
      },
    });

    if (!leadGrant) {
      return NextResponse.json(
        { message: "You are not authorized to approve this proposal" },
        { status: 403 }
      );
    }

    // Update or create lead approval
    const leadApproval = await prisma.proposalLeadApproval.upsert({
      where: {
        proposalId_leadRole: {
          proposalId,
          leadRole,
        },
      },
      update: {
        approved,
        comments,
        leadEmail: user.email.toLowerCase(),
      },
      create: {
        proposalId,
        leadRole,
        leadEmail: user.email.toLowerCase(),
        approved,
        comments,
      },
    });

    // Check if all leads have approved
    const allApprovals = await prisma.proposalLeadApproval.findMany({
      where: { proposalId },
    });

    const allApproved = allApprovals.every((approval) => approval.approved);
    const anyRejected = allApprovals.some(
      (approval) => !approval.approved && approval.comments
    );

    // Update proposal status based on lead approvals
    let newStatus:
      | "LEAD_REVIEW"
      | "LEAD_APPROVED"
      | "LEAD_REJECTED"
      | "PENDING"
      | "SU_APPROVED"
      | "SU_REJECTED"
      | "DIRECTOR_APPROVED"
      | "DIRECTOR_REJECTED"
      | "RESUBMISSION_REQUIRED";
    if (anyRejected) {
      newStatus = "LEAD_REJECTED";
    } else if (allApproved && allApprovals.length >= 2) {
      newStatus = "PENDING"; // Move to Student Union review
    } else {
      newStatus = "LEAD_REVIEW"; // Still waiting for other leads
    }

    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: newStatus },
    });

    if (newStatus === "LEAD_REJECTED") {
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        select: {
          id: true,
          submittedBy: true,
          event: { select: { title: true } },
        },
      });

      const rejecting = allApprovals
        .filter((a) => !a.approved && a.comments)
        .map((a) => `(${a.leadRole}) ${a.comments}`)
        .join("\n");

      if (proposal?.submittedBy) {
        await sendProposalStatusEmail({
          to: proposal.submittedBy,
          proposalId,
          eventTitle: proposal.event?.title || "Untitled Event",
          subject: "EventGate: Proposal needs changes (Lead review)",
          heading: "Proposal needs changes (Lead review)",
          message:
            "Your proposal was rejected during lead review. Please review the comments below, fix the issues, and resubmit.\n\n" +
            rejecting,
          actionLabel: "Open Proposal",
          actionPath: `/proposals/${proposalId}/edit`,
        });
      }
    }

    return NextResponse.json({
      message: `Proposal ${approved ? "approved" : "rejected"} by ${leadRole}`,
      leadApproval,
      newStatus,
    });
  } catch (error) {
    console.error("Lead approval error:", error);
    return NextResponse.json(
      { message: "Failed to process approval" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

  try {
    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get("proposalId");

    if (proposalId) {
      // Get lead approvals for a specific proposal
      const approvals = await prisma.proposalLeadApproval.findMany({
        where: { proposalId },
        include: {
          proposal: {
            include: {
              event: {
                select: {
                  title: true,
                  description: true,
                  location: true,
                  startTime: true,
                  endTime: true,
                },
              },
              collaborators: true,
              guests: true,
              club: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ approvals });
    } else {
      // Get all proposals that need this user's review
      const userRoleGrants = await prisma.clubRoleGrant.findMany({
        where: {
          email: user.email.toLowerCase(),
          role: {
            in: ["VP", "SECRETARY"],
          },
        },
        select: {
          role: true,
          clubId: true,
        },
      });

      if (userRoleGrants.length === 0) {
        return NextResponse.json({ approvals: [] });
      }

      // Get all proposals for the user's clubs
      const proposals = await prisma.proposal.findMany({
        where: {
          clubId: {
            in: userRoleGrants.map((g) => g.clubId),
          },
          status: {
            in: ["LEAD_REVIEW", "LEAD_APPROVED"],
          },
        },
        include: {
          event: {
            select: {
              title: true,
              description: true,
              location: true,
              startTime: true,
              endTime: true,
            },
          },
          collaborators: true,
          guests: true,
          club: {
            select: {
              name: true,
            },
          },
          leadApprovals: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({ approvals: proposals });
    }
  } catch (error) {
    console.error("Get lead approvals error:", error);
    return NextResponse.json(
      { message: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}
