import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SecretaryHeader } from "@/components/secretary-header";

export default async function SecretaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session?.user;

  if (!user) {
    redirect("/login?redirect=" + encodeURIComponent("/secretary"));
  }

  if (!user.emailVerified) {
    redirect("/verify?email=" + encodeURIComponent(user.email || ""));
  }

  const grant = await prisma.clubRoleGrant.findFirst({
    where: {
      email: user.email.toLowerCase(),
      role: "SECRETARY",
    },
  });

  if (!grant) {
    redirect("/");
  }

  return (
    <div className="min-h-svh bg-background">
      <SecretaryHeader userEmail={user.email} />
      {children}
    </div>
  );
}
