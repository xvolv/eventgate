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

  // Get the president's club information and all officers
  const presidentGrant = await prisma.clubRoleGrant.findFirst({
    where: {
      email: user.email.toLowerCase(),
      role: "PRESIDENT",
    },
    include: {
      club: {
        include: {
          roleGrants: {
            where: {
              role: {
                in: ["PRESIDENT", "VP", "SECRETARY"],
              },
            },
            orderBy: {
              role: "asc",
            },
          },
        },
      },
    },
  });

  if (!presidentGrant) {
    return NextResponse.json(
      { message: "Only club presidents can access this endpoint" },
      { status: 403 }
    );
  }

  // Get user information for all officers
  const officerEmails = presidentGrant.club.roleGrants.map(
    (grant) => grant.email
  );
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: officerEmails,
      },
    },
    select: {
      email: true,
      name: true,
    },
  });

  // Create a map for quick lookup
  const userMap = users.reduce((acc, user) => {
    acc[user.email] = user;
    return acc;
  }, {} as Record<string, { name: string; email: string }>);

  // Extract officer information with user names
  const officers = {
    president: presidentGrant.club.roleGrants.find(
      (g: any) => g.role === "PRESIDENT"
    ),
    vicePresident: presidentGrant.club.roleGrants.find(
      (g: any) => g.role === "VP"
    ),
    secretary: presidentGrant.club.roleGrants.find(
      (g: any) => g.role === "SECRETARY"
    ),
  };

  return NextResponse.json({
    club: {
      id: presidentGrant.clubId,
      name: presidentGrant.club.name,
    },
    officers: {
      president: officers.president
        ? {
            email: officers.president.email,
            name: userMap[officers.president.email]?.name || null,
          }
        : null,
      vicePresident: officers.vicePresident
        ? {
            email: officers.vicePresident.email,
            name: userMap[officers.vicePresident.email]?.name || null,
          }
        : null,
      secretary: officers.secretary
        ? {
            email: officers.secretary.email,
            name: userMap[officers.secretary.email]?.name || null,
          }
        : null,
    },
    presidentEmail: user.email.toLowerCase(),
  });
}
