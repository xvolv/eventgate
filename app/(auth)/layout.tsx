"use client";

import { AuthHeader } from "@/components/auth-header";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideHeader = pathname === "/verify";

  return (
    <>
      {!hideHeader && <AuthHeader userEmail="" />}
      {children}
    </>
  );
}
