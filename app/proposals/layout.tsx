import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session?.user;

  if (!user) {
    redirect("/login?redirect=" + encodeURIComponent("/proposals/new"));
  }

  if (!user.emailVerified) {
    redirect("/verify?email=" + encodeURIComponent(user.email || ""));
  }

  const grants = await prisma.systemRoleGrant.findMany({
    where: { email: user.email.toLowerCase() },
    select: { role: true },
  });

  const roles = new Set(grants.map((g) => g.role));

  if (roles.has("ADMIN")) {
    redirect("/admin");
  }
  if (roles.has("STUDENT_UNION")) {
    redirect("/student-union");
  }
  if (roles.has("DIRECTOR")) {
    redirect("/director");
  }

  return <>{children}</>;
}
