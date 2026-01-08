"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signOut, useSession } from "@/lib/auth-client";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use session data if available, otherwise fall back to props
  const currentIsAuthed = session?.user ? true : isAuthed;
  const currentIsVerified = session?.user?.emailVerified ? true : isVerified;
  const currentUserEmail = session?.user?.email || userEmail;

  // If session is null (signed out), redirect to home immediately
  useEffect(() => {
    if (session === null && isAuthed) {
      router.push("/");
    }
  }, [session, isAuthed, router]);

  const currentSection = (() => {
    if (!currentIsAuthed) return "Public";
    if (!currentIsVerified) return "Verify Email";
    if (dashboardHref.startsWith("/admin")) return "Administration";
    if (dashboardHref.startsWith("/student-union")) return "Student Union";
    if (dashboardHref.startsWith("/director")) return "Director";
    return "Dashboard";
  })();

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      // Let the useEffect handle redirect after session clears
    } catch {
      router.push("/");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-30 w-full border-b border-border bg-background"
      role="banner"
    >
      <div className="w-full bg-slate-900 text-white">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="font-semibold tracking-wide">
              EventGate
            </Link>
            <div className="hidden sm:block h-5 w-px bg-white/20" />
            <div className="min-w-0">
              <div className="text-sm font-medium leading-5">
                Event Proposal Portal
              </div>
              <div className="hidden md:block text-xs text-white/70 truncate">
                {currentSection}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentIsAuthed && (
              <div className="hidden lg:block text-xs text-white/70 truncate max-w-[28rem]">
                {currentUserEmail}
              </div>
            )}

            {mounted ? (
              <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    className="md:hidden h-9 w-9 p-0 bg-white text-slate-900 hover:bg-white/90"
                    aria-label="Open menu"
                  >
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="fixed right-0 top-0 left-auto bottom-0 h-dvh w-[20rem] max-w-[calc(100%-3rem)] translate-x-0 translate-y-0 rounded-none p-0 sm:max-w-[20rem]">
                  <div className="flex h-full flex-col">
                    <div className="border-b border-border bg-slate-900 px-4 py-4 text-white">
                      <DialogTitle className="text-sm font-semibold tracking-wide">
                        Menu
                      </DialogTitle>
                      {currentIsAuthed && (
                        <div className="mt-1 text-xs text-white/70 truncate">
                          {currentUserEmail}
                        </div>
                      )}
                    </div>

                    <nav aria-label="Site navigation" className="flex-1 p-2">
                      {currentIsAuthed ? (
                        <>
                          {currentIsVerified ? (
                            <Link
                              href={dashboardHref}
                              onClick={() => setMenuOpen(false)}
                              className="block"
                            >
                              <Button
                                variant="ghost"
                                className="h-10 w-full justify-start rounded-none"
                              >
                                Dashboard
                              </Button>
                            </Link>
                          ) : (
                            <Link
                              href={
                                "/verify?email=" +
                                encodeURIComponent(currentUserEmail || "")
                              }
                              onClick={() => setMenuOpen(false)}
                              className="block"
                            >
                              <Button
                                variant="ghost"
                                className="h-10 w-full justify-start rounded-none"
                              >
                                Verify Email
                              </Button>
                            </Link>
                          )}
                        </>
                      ) : (
                        <>
                          <Link
                            href="/login"
                            onClick={() => setMenuOpen(false)}
                            className="block"
                          >
                            <Button
                              variant="ghost"
                              className="h-10 w-full justify-start rounded-none"
                            >
                              Sign In
                            </Button>
                          </Link>
                          <Link
                            href="/sign-up"
                            onClick={() => setMenuOpen(false)}
                            className="block"
                          >
                            <Button
                              variant="ghost"
                              className="h-10 w-full justify-start rounded-none"
                            >
                              Create Account
                            </Button>
                          </Link>
                        </>
                      )}
                    </nav>

                    {currentIsAuthed && (
                      <div className="border-t border-border p-3">
                        <Button
                          onClick={() => {
                            setMenuOpen(false);
                            handleSignOut();
                          }}
                          className="h-10 w-full rounded-none"
                          disabled={signingOut}
                        >
                          Sign Out
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                variant="secondary"
                className="md:hidden h-9 w-9 p-0 bg-white text-slate-900 hover:bg-white/90"
                aria-label="Open menu"
                type="button"
                disabled
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            )}

            {currentIsAuthed && (
              <Button
                onClick={handleSignOut}
                variant="secondary"
                className="hidden md:inline-flex h-9 bg-white text-slate-900 hover:bg-white/90"
                disabled={signingOut}
              >
                Sign out
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full bg-background">
        <div className="container mx-auto px-4">
          <nav
            aria-label="Site navigation"
            className="hidden py-3 md:flex md:flex-row md:items-center md:justify-between"
          >
            <div />
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              {currentIsAuthed ? (
                <>
                  {currentIsVerified ? (
                    <Link href={dashboardHref}>
                      <Button
                        variant="outline"
                        className="h-9 w-full justify-start md:w-auto"
                      >
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link
                      href={
                        "/verify?email=" +
                        encodeURIComponent(currentUserEmail || "")
                      }
                    >
                      <Button
                        variant="outline"
                        className="h-9 w-full justify-start md:w-auto"
                      >
                        Verify Email
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-start md:w-auto"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="h-9 w-full justify-start md:w-auto">
                      Create Account
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
