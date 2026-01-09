"use client";

import { usePathname } from "next/navigation";

export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }

  if (pathname === "/president" || pathname.startsWith("/president/")) {
    return null;
  }

  if (pathname === "/vp" || pathname.startsWith("/vp/")) {
    return null;
  }

  if (pathname === "/secretary" || pathname.startsWith("/secretary/")) {
    return null;
  }

  if (pathname === "/student-union" || pathname.startsWith("/student-union/")) {
    return null;
  }

  if (pathname === "/director" || pathname.startsWith("/director/")) {
    return null;
  }

  // Hide main Nav on auth routes
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return null;
  }

  if (pathname === "/sign-up" || pathname.startsWith("/sign-up/")) {
    return null;
  }

  // Hide main Nav on root path for presidents
  if (pathname === "/") {
    return null;
  }

  return <>{children}</>;
}
