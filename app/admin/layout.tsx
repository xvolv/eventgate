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

  const admin = await prisma.systemRoleGrant.findFirst({
    where: {
      email: { equals: user.email, mode: "insensitive" },
      role: "ADMIN",
    },
  });

  if (!admin) {
    redirect("/");
  }

  return (
    <>
      <AdminHeader userEmail={user.email} />
      <main className="w-full">{children}</main>
    </>
  );
}
