import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentUnionHeader } from "@/components/student-union-header";

export default async function StudentUnionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session?.user;

  if (!user) {
    redirect("/login?redirect=" + encodeURIComponent("/student-union"));
  }

  if (!user.emailVerified) {
    redirect("/verify?email=" + encodeURIComponent(user.email || ""));
  }

  const grant = await prisma.systemRoleGrant.findUnique({
    where: {
      email_role: {
        email: user.email.toLowerCase(),
        role: "STUDENT_UNION",
      },
    },
  });

  if (!grant) {
    redirect("/");
  }

  return (
    <div className="min-h-svh bg-background">
      <StudentUnionHeader userEmail={user.email} />
      {children}
    </div>
  );
}
