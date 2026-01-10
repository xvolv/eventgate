import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Check if user is a Student Union member
  const suGrant = await prisma.systemRoleGrant.findUnique({
    where: {
      email_role: {
        email: user.email.toLowerCase(),
        role: "STUDENT_UNION",
      },
    },
  });

  if (!suGrant) {
    return NextResponse.json(
      { message: "Only Student Union members can view proposals" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Fetch proposals that have been approved by both VP and Secretary
    const where = {
      status: "PENDING" as const, // Only proposals ready for Student Union review
    };

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          event: true,
          collaborators: true,
          guests: true,
          club: {
            select: { name: true },
          },
          leadApprovals: {
            where: {
              leadRole: {
                in: ["VP", "SECRETARY"], // Only show VP and Secretary approvals
              },
            },
          },
        },
      }),
      prisma.proposal.count({ where }),
    ]);

    // Filter proposals that have both VP and Secretary approvals
    const filteredProposals = proposals.filter((proposal) => {
      const vpApproval = proposal.leadApprovals?.find(
        (approval: any) => approval.leadRole === "VP"
      );
      const secretaryApproval = proposal.leadApprovals?.find(
        (approval: any) => approval.leadRole === "SECRETARY"
      );
      return vpApproval?.approved && secretaryApproval?.approved;
    });

    return NextResponse.json({
      proposals: filteredProposals,
      pagination: {
        page,
        limit,
        total: filteredProposals.length,
        totalPages: Math.ceil(filteredProposals.length / limit),
      },
    });
  } catch (error) {
    console.error("Student Union proposals fetch error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch proposals",
      },
      { status: 500 }
    );
  }
}
