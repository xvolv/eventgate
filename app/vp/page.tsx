import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VPPage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session?.user;

  if (!user) {
    redirect("/login?redirect=" + encodeURIComponent("/vp"));
  }

  if (!user.emailVerified) {
    redirect("/verify?email=" + encodeURIComponent(user.email || ""));
  }

  // Check if user has VP role
  const vpGrant = await prisma.clubRoleGrant.findFirst({
    where: {
      email: user.email.toLowerCase(),
      role: "VP",
    },
    include: {
      club: true,
    },
  });

  if (!vpGrant) {
    redirect("/proposals/new");
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Vice President</h1>
      <p className="text-sm text-muted-foreground">
        Review and approve proposals submitted by your club president.
      </p>

      <div className="mt-8 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Club: {vpGrant.club.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              As Vice President, you can approve proposals submitted by the club
              president.
            </p>
            <p className="mt-2">No proposals pending approval at this time.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
