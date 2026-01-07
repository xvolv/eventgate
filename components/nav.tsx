"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";

export default function Nav() {
  const { data } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (e) {
      // no-op
    }
  };
  const user = data?.user;
  const isVerified = Boolean(user?.emailVerified);

  return (
    <header className="border-b border-border bg-background/60 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          EventGate
        </Link>
        <nav className="flex items-center gap-2">
          {isVerified ? (
            <>
              <Link href="/proposals/new">
                <Button variant="outline" className="rounded-none">
                  New Proposal
                </Button>
              </Link>
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
