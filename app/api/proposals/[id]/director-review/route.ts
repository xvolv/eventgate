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

  // Check if user is Director
  const directorGrant = await prisma.systemRoleGrant.findFirst({
    where: {
      email: user.email.toLowerCase(),
      role: "DIRECTOR",
    },
  });

  if (!directorGrant) {
    return NextResponse.json(
      { message: "Only Directors can review proposals" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { directorApproval, directorComments } = body;

    if (
      directorApproval === undefined ||
      directorApproval === null ||
      !directorComments
    ) {
      return NextResponse.json(
        {
          message: "Approval decision and comments are required",
        },
        { status: 400 }
      );
    }

    const normalizedDecision = String(directorApproval);
    const directorApproved = normalizedDecision === "Approved";

    // Update proposal with Director review
    const updatedProposal = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        status: directorApproved ? "DIRECTOR_APPROVED" : "DIRECTOR_REJECTED",
        reviews: {
          upsert: {
            where: {
              proposalId_reviewerRole: {
                proposalId: params.id,
                reviewerRole: "DIRECTOR",
              },
            },
            create: {
              reviewerRole: "DIRECTOR",
              reviewerEmail: user.email.toLowerCase(),
              recommendation: directorApproved
                ? "Recommended"
                : "Not Recommended",
              comments: directorComments,
              approved: directorApproved,
            },
            update: {
              reviewerEmail: user.email.toLowerCase(),
              recommendation: directorApproved
                ? "Recommended"
                : "Not Recommended",
              comments: directorComments,
              approved: directorApproved,
            },
          },
        },
      },
    });

    // TODO: Send email notification to President
    // TODO: If approved, send guest ID request email

    return NextResponse.json({
      message: `Proposal ${
        directorApproved ? "approved" : "rejected"
      } by Director`,
      proposal: updatedProposal,
    });
  } catch (error) {
    console.error("Director review error:", error);
    return NextResponse.json(
      {
        message: "Failed to review proposal",
      },
      { status: 500 }
    );
  }
}
