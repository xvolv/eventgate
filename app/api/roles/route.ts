import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;

  if (!user?.email) {
    return NextResponse.json({ systemRoles: [], clubRoles: [] });
  }

  const email = user.email.toLowerCase();

  const [systemRoleGrants, clubRoleGrants] = await Promise.all([
    prisma.systemRoleGrant.findMany({
      where: { email },
      select: { role: true },
    }),
    prisma.clubRoleGrant.findMany({
      where: { email },
      select: { role: true },
    }),
  ]);

  return NextResponse.json({
    systemRoles: systemRoleGrants.map((g) => g.role),
    clubRoles: clubRoleGrants.map((g) => g.role),
  });
}
