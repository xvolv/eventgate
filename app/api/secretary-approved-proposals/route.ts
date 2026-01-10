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

  const email = user.email.toLowerCase();
  const secretaryGrant = await prisma.clubRoleGrant.findFirst({
    where: { email, role: "SECRETARY" },
    select: { id: true },
  });

  if (!secretaryGrant) {
    return NextResponse.json(
      { message: "Only Secretaries can view proposals" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = {
      leadApprovals: {
        some: {
          leadRole: "SECRETARY",
          leadEmail: email,
        },
      },
    };

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          event: true,
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
        },
      }),
      prisma.proposal.count({ where }),
    ]);

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
    console.error("Secretary approved proposals fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}
