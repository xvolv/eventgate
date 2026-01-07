"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export function HomeActions() {
  const { data, isPending } = useSession();
  const user = data?.user;
  const isAuthed = Boolean(user);
  const isVerified = Boolean(user?.emailVerified);
  const [dashboardHref, setDashboardHref] = useState("/proposals/new");

  useEffect(() => {
    let cancelled = false;

    if (!isVerified) {
      setDashboardHref("/proposals/new");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/roles", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const roles: string[] = Array.isArray(json?.systemRoles)
          ? json.systemRoles
          : [];
        const nextHref = roles.includes("ADMIN")
          ? "/admin/clubs/new"
          : roles.includes("STUDENT_UNION")
            ? "/student-union"
            : roles.includes("DIRECTOR")
              ? "/director"
              : "/proposals/new";
        if (!cancelled) setDashboardHref(nextHref);
      } catch {
        if (!cancelled) setDashboardHref("/proposals/new");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isVerified]);

  if (isPending) {
    return null;
  }

  if (isAuthed && !isVerified) {
    return (
      <div className="flex gap-3 mb-12">
        <Link href={"/verify?email=" + encodeURIComponent(user?.email || "") }>
          <Button size="lg" className="rounded-none hover:cursor-pointer">
            Verify Email
          </Button>
        </Link>
      </div>
    );
  }

  if (isAuthed && isVerified) {
    return (
      <div className="flex gap-3 mb-12">
        <Link href={dashboardHref}>
          <Button size="lg" className="rounded-none hover:cursor-pointer">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-12">
      <Link href="/sign-up">
        <Button size="lg" className="rounded-none hover:cursor-pointer">
          Create Account
        </Button>
      </Link>
      <Link href="/login">
        <Button
          size="lg"
          variant="outline"
          className="rounded-none hover:cursor-pointer"
        >
          Sign In
        </Button>
      </Link>
    </div>
  );
}
