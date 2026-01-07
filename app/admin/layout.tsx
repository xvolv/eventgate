import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "./admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session?.user;

  if (!user) {
    redirect("/login?redirect=" + encodeURIComponent("/admin"));
  }

  if (!user.emailVerified) {
    redirect("/verify?email=" + encodeURIComponent(user.email || ""));
  }

  const admin = await prisma.systemRoleGrant.findUnique({
    where: { email_role: { email: user.email.toLowerCase(), role: "ADMIN" } },
  });

  if (!admin) {
    redirect("/");
  }

  return (
    <>
      <AdminHeader userEmail={user.email} />
      <main className="container mx-auto max-w-5xl px-4 py-10">
        {children}
      </main>
    </>
  );
}
