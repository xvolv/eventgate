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
        dashboardHref="/president"
      />
    );
  }

  const email = String(user.email).trim();
  const isVerified = Boolean(user.emailVerified);
  let dashboardHref = "/president";

  if (isVerified) {
    try {
      const [systemGrants, clubGrants] = await Promise.all([
        prisma.systemRoleGrant.findMany({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { role: true },
        }),
        prisma.clubRoleGrant.findMany({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { role: true },
        }),
      ]);

      const systemRoles = systemGrants.map((g) => g.role);
      const clubRoles = clubGrants.map((g) => g.role);

      if (systemRoles.includes("ADMIN")) {
        dashboardHref = "/admin/clubs";
      } else if (systemRoles.includes("STUDENT_UNION")) {
        dashboardHref = "/student-union";
      } else if (systemRoles.includes("DIRECTOR")) {
        dashboardHref = "/director";
      } else if (clubRoles.includes("VP")) {
        dashboardHref = "/vp";
      } else if (clubRoles.includes("SECRETARY")) {
        dashboardHref = "/secretary";
      } else if (clubRoles.includes("PRESIDENT")) {
        dashboardHref = "/president";
      }
    } catch {
      dashboardHref = "/president";
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
