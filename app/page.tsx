import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HomeActions } from "./home-actions";
import { LandingHeader } from "@/components/landing-header";

export default async function HomePage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });

  if (!session?.user) {
    return (
      <div className="min-h-svh bg-background">
        <LandingHeader userEmail="" />
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-semibold mb-4 text-balance">
              Streamline Your Event Approval Process
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              EventGate is a professional event proposal and approval system
              designed for governmental and organizational event management.
              Submit proposals, track status, and manage approvals all in one
              place.
            </p>

            <HomeActions />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
              <div>
                <h3 className="font-semibold text-lg mb-2">For Requesters</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Submit event proposals with detailed information</li>
                  <li>Track proposal status in real-time</li>
                  <li>Receive notifications on approvals</li>
                  <li>Maintain audit trail of all actions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">For Approvers</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Review all event proposals systematically</li>
                  <li>Approve or reject with detailed feedback</li>
                  <li>View approval history and audit trails</li>
                  <li>Access system-wide statistics and insights</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border mt-12 pt-12">
              <h3 className="font-semibold text-lg mb-4">Core Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="font-medium mb-2">7-Day Advance Submission</p>
                  <p className="text-muted-foreground">
                    All events must be submitted at least 7 days in advance
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-2">Role-Based Access</p>
                  <p className="text-muted-foreground">
                    Different views and permissions for requesters and approvers
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-2">Complete Audit Trail</p>
                  <p className="text-muted-foreground">
                    Track every submission, approval, and modification
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-border mt-16 py-6 text-center text-sm text-muted-foreground">
          <p>EventGate - Professional Event Proposal System</p>
        </footer>
      </div>
    );
  }

  const user = session.user;
  const email = user.email.toLowerCase();

  // Check system roles first (highest priority)
  const adminGrant = await prisma.systemRoleGrant.findFirst({
    where: { email, role: "ADMIN" },
  });
  if (adminGrant) {
    redirect("/admin");
  }

  const directorGrant = await prisma.systemRoleGrant.findFirst({
    where: { email, role: "DIRECTOR" },
  });
  if (directorGrant) {
    redirect("/director");
  }

  const studentUnionGrant = await prisma.systemRoleGrant.findFirst({
    where: { email, role: "STUDENT_UNION" },
  });
  if (studentUnionGrant) {
    redirect("/student-union");
  }

  // Check club roles
  const presidentGrant = await prisma.clubRoleGrant.findFirst({
    where: { email, role: "PRESIDENT" },
  });
  if (presidentGrant) {
    redirect("/president");
  }

  const vpGrant = await prisma.clubRoleGrant.findFirst({
    where: { email, role: "VP" },
  });
  if (vpGrant) {
    redirect("/vp");
  }

  const secretaryGrant = await prisma.clubRoleGrant.findFirst({
    where: { email, role: "SECRETARY" },
  });
  if (secretaryGrant) {
    redirect("/secretary");
  }

  // No specific role found, redirect to login
  redirect("/login");
}
