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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = {
      status: status ? status : "SU_APPROVED", // Default to show proposals ready for SU review
    };

    // Get proposals that need Student Union review
    const proposals = await prisma.proposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        club: {
          select: { name: true },
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
    console.error("Student Union proposals fetch error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch proposals",
      },
      { status: 500 }
    );
  }
}
