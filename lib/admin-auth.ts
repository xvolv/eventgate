import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionFromRequest(request: Request) {
  const response = await auth.api.getSession({
    headers: request.headers,
  });

  // When not logged in, better-auth returns null.
  return response;
}

export async function requireAdmin(request: Request) {
  const session = await getSessionFromRequest(request);
  const user = session?.user;

  if (!user?.email) {
    return { ok: false as const, status: 401 as const, user: null };
  }

  const grant = await prisma.systemRoleGrant.findUnique({
    where: {
      email_role: {
        email: user.email.toLowerCase(),
        role: "ADMIN",
      },
    },
  });

  if (!grant) {
    return { ok: false as const, status: 403 as const, user };
  }

  return { ok: true as const, status: 200 as const, user };
}
