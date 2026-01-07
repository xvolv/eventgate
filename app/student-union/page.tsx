import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentUnionPage() {
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
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Student Union</h1>
      <p className="text-sm text-muted-foreground">
        Review and manage student-union approvals.
      </p>

      <div className="mt-8 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This page is ready for the Student Union workflow.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
