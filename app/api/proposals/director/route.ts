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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = {
      status: status ? status : "SU_APPROVED", // Default to show proposals approved by SU
    };

    // Get proposals that need Director review
    const proposals = await prisma.proposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        event: { include: { occurrences: true } },
        collaborators: true,
        guests: true,
        club: {
          select: { name: true },
        },
        leadApprovals: {
          where: {
            leadRole: {
              in: ["VP", "SECRETARY"],
            },
          },
        },
        reviews: {
          where: {
            reviewerRole: "STUDENT_UNION",
          },
          select: {
            reviewerRole: true,
            reviewerEmail: true,
            recommendation: true,
            comments: true,
            updatedAt: true,
          },
        },
      },
    });

    const total = await prisma.proposal.count({ where });

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Director proposals fetch error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch proposals",
      },
      { status: 500 }
    );
  }
}
