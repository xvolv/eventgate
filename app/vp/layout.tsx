import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VPHeader } from "@/components/vp-header";

export default async function VPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session?.user;

  if (!user) {
    redirect("/login?redirect=" + encodeURIComponent("/vp"));
  }

  if (!user.emailVerified) {
    redirect("/verify?email=" + encodeURIComponent(user.email || ""));
  }

  const grant = await prisma.clubRoleGrant.findFirst({
    where: {
      email: user.email.toLowerCase(),
      role: "VP",
    },
  });

  if (!grant) {
    redirect("/");
  }

  return (
    <div className="min-h-svh bg-background">
      <VPHeader userEmail={user.email} />
      {children}
    </div>
  );
}
