import { headers } from "next/headers";
import NavClient from "./nav-client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Nav() {
  const hdrs = await headers();

  let session = null;
  try {
    session = await auth.api.getSession({ headers: hdrs });
  } catch {
    session = null;
  }

  const user = session?.user;

  if (!user?.email) {
    return (
      <NavClient
        isAuthed={false}
        isVerified={false}
        dashboardHref="/proposals/new"
      />
    );
  }

  const email = user.email.toLowerCase();
  const isVerified = Boolean(user.emailVerified);
  let dashboardHref = "/proposals/new";

  if (isVerified) {
    try {
      const grants = await prisma.systemRoleGrant.findMany({
        where: { email },
        select: { role: true },
      });
      const roles = grants.map((g) => g.role);

      if (roles.includes("ADMIN")) {
        dashboardHref = "/admin/clubs/new";
      } else if (roles.includes("STUDENT_UNION")) {
        dashboardHref = "/student-union";
      } else if (roles.includes("DIRECTOR")) {
        dashboardHref = "/director";
      }
    } catch {
      dashboardHref = "/proposals/new";
    }
  }

  return (
    <NavClient
      isAuthed
      isVerified={isVerified}
      dashboardHref={dashboardHref}
      userEmail={user.email}
    />
  );
}
