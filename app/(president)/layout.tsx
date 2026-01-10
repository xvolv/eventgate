import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PresidentHeader } from "@/components/president-header";
import { LandingHeader } from "@/components/landing-header";

export default async function PresidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session?.user;

  if (!user) {
    // Show landing header for non-authenticated users
    return (
      <>
        <LandingHeader userEmail="" />
        {children}
      </>
    );
  }

  if (!user.emailVerified) {
    redirect("/verify?email=" + encodeURIComponent(user.email || ""));
  }

  // Check if user is a president
  const userEmail = String(user.email || "").trim();
  const presidentGrant = await prisma.clubRoleGrant.findFirst({
    where: {
      email: { equals: userEmail, mode: "insensitive" },
      role: "PRESIDENT",
    },
  });

  if (!presidentGrant) {
    // Not a president, show landing header
    return (
      <>
        <LandingHeader userEmail={user.email} />
        {children}
      </>
    );
  }

  // User is a president, show president header
  return (
    <>
      <PresidentHeader userEmail={user.email} />
      {children}
    </>
  );
}
