"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export default function Nav() {
  const { data, isPending } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (e) {
      // no-op
    }
  };
  const user = data?.user;
  const isAuthed = Boolean(user);
  const isVerified = Boolean(user?.emailVerified);

  useEffect(() => {
    let cancelled = false;

    if (!isVerified) {
      setIsAdmin(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/roles", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const admin =
          Array.isArray(json?.systemRoles) && json.systemRoles.includes("ADMIN");
        if (!cancelled) setIsAdmin(admin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isVerified]);

  const dashboardHref = isAdmin ? "/admin/clubs/new" : "/proposals/new";

  return (
    <header className="border-b border-border bg-background/60 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          EventGate
        </Link>
        <nav className="flex items-center gap-2">
          {isPending ? null : isAuthed ? (
            <>
              {isVerified ? (
                <Link href={dashboardHref}>
                  <Button variant="outline" className="rounded-none">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href={"/verify?email=" + encodeURIComponent(user?.email || "") }>
                  <Button variant="outline" className="rounded-none">
                    Verify Email
                  </Button>
                </Link>
              )}
              <Button onClick={handleSignOut} className="rounded-none">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" className="rounded-none">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="rounded-none">Create Account</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
