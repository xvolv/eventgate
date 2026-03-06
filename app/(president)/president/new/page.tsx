import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewProposalForm from "./new-proposal-form";

export default async function PresidentNewProposalPage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session?.user;

  if (!user) {
    redirect("/login?redirect=" + encodeURIComponent("/president/new"));
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
    redirect("/");
  }

  return <NewProposalForm userEmail={user.email} />;
}
