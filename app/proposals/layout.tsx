import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProposalsHeader } from "./proposals-header";

export default async function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session?.user;

  if (!user) {
    redirect("/login?redirect=" + encodeURIComponent("/president/new"));
  }

  if (!user.emailVerified) {
    redirect("/verify?email=" + encodeURIComponent(user.email || ""));
  }

  // Check system roles first
  const systemGrants = await prisma.systemRoleGrant.findMany({
    where: { email: user.email.toLowerCase() },
    select: { role: true },
  });

  const systemRoles = new Set(systemGrants.map((g) => g.role));

  if (systemRoles.has("ADMIN")) {
    redirect("/admin");
  }
  if (systemRoles.has("STUDENT_UNION")) {
    redirect("/student-union");
  }
  if (systemRoles.has("DIRECTOR")) {
    redirect("/director");
  }

  // Check club roles
  const clubGrants = await prisma.clubRoleGrant.findMany({
    where: { email: user.email.toLowerCase() },
    select: { role: true },
  });

  const clubRoles = new Set(clubGrants.map((g) => g.role));

  if (clubRoles.has("VP")) {
    redirect("/vp");
  }
  if (clubRoles.has("SECRETARY")) {
    redirect("/secretary");
  }

  // If no special roles, allow access to proposals (for presidents)
  return (
    <>
      <ProposalsHeader userEmail={user.email} />
      {children}
    </>
  );
}
