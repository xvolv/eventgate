"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

type NavClientProps = {
  isAuthed: boolean;
  isVerified: boolean;
  dashboardHref: string;
  userEmail?: string | null;
};

export default function NavClient({
  isAuthed,
  isVerified,
  dashboardHref,
  userEmail,
}: NavClientProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } catch {
      router.push("/");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="border-b border-border bg-background/60 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          EventGate
        </Link>
        <nav className="flex items-center gap-2">
          {isAuthed ? (
            <>
              {isVerified ? (
                <Link href={dashboardHref}>
                  <Button variant="outline" className="rounded-none">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link
                  href={"/verify?email=" + encodeURIComponent(userEmail || "")}
                >
                  <Button variant="outline" className="rounded-none">
                    Verify Email
                  </Button>
                </Link>
              )}
              <span className="hidden md:inline text-sm text-muted-foreground">
                {userEmail}
              </span>
              <Button
                onClick={handleSignOut}
                className="rounded-none"
                disabled={signingOut}
              >
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
