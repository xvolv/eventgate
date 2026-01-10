import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;

  if (!user?.email) {
    return jsonNoStore({ systemRoles: [], clubRoles: [] });
  }

  const email = String(user.email).trim();

  const [systemRoleGrants, clubRoleGrants] = await Promise.all([
    prisma.systemRoleGrant.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { role: true },
    }),
    prisma.clubRoleGrant.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { role: true },
    }),
  ]);

  return jsonNoStore({
    systemRoles: systemRoleGrants.map((g) => g.role),
    clubRoles: clubRoleGrants.map((g) => g.role),
  });
}
