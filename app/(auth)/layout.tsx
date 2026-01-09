"use client";

import { AuthHeader } from "@/components/auth-header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthHeader userEmail="" />
      {children}
    </>
  );
}
