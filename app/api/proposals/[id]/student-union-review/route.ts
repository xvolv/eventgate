import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Check if user is Student Union member
  const suGrant = await prisma.systemRoleGrant.findFirst({
    where: {
      email: user.email.toLowerCase(),
      role: "STUDENT_UNION",
    },
  });

  if (!suGrant) {
    return NextResponse.json(
      { message: "Only Student Union members can review proposals" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { suRecommendation, suComments } = body;

    if (!suRecommendation) {
      return NextResponse.json(
        {
          message: "Recommendation is required",
        },
        { status: 400 }
      );
    }

    const normalizedRecommendation = String(suRecommendation);
    const suApproved = normalizedRecommendation === "Recommended";

    const updatedProposal = await prisma.$transaction(async (tx) => {
      await tx.proposalReview.upsert({
        where: {
          proposalId_reviewerRole: {
            proposalId,
            reviewerRole: "STUDENT_UNION",
          },
        },
        create: {
          proposalId,
          reviewerRole: "STUDENT_UNION",
          reviewerEmail: user.email.toLowerCase(),
          recommendation: normalizedRecommendation,
          comments: suComments ?? "",
          approved: suApproved,
        },
        update: {
          reviewerEmail: user.email.toLowerCase(),
          recommendation: normalizedRecommendation,
          comments: suComments ?? "",
          approved: suApproved,
        },
      });

      return tx.proposal.update({
        where: { id: proposalId },
        data: {
          status: suApproved ? "SU_APPROVED" : "SU_REJECTED",
        },
      });
    });

    // TODO: Send email notification to President

    return NextResponse.json({
      message: `Proposal ${
        suApproved ? "approved" : "rejected"
      } by Student Union`,
      proposal: updatedProposal,
    });
  } catch (error) {
    console.error("Student Union review error:", error);
    const detail = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      {
        message: detail || "Failed to review proposal",
      },
      { status: 500 }
    );
  }
}
