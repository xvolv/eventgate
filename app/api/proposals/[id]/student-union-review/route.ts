import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    if (!suRecommendation || !suComments) {
      return NextResponse.json(
        {
          message: "Recommendation and comments are required",
        },
        { status: 400 }
      );
    }

    // Update proposal with Student Union review
    const updatedProposal = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        suRecommendation,
        suComments,
        suApprovedBy: user.email.toLowerCase(),
        suApprovedAt: new Date(),
        status:
          suRecommendation === "Recommended" ? "SU_APPROVED" : "SU_REJECTED",
      },
    });

    // TODO: Send email notification to President

    return NextResponse.json({
      message: `Proposal ${
        suRecommendation === "Recommended" ? "approved" : "rejected"
      } by Student Union`,
      proposal: updatedProposal,
    });
  } catch (error) {
    console.error("Student Union review error:", error);
    return NextResponse.json(
      {
        message: "Failed to review proposal",
      },
      { status: 500 }
    );
  }
}
