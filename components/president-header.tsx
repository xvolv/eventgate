"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { MenuIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signOut, useSession } from "@/lib/auth-client";

function isActive(pathname: string, href: string) {
  return pathname === href;
}

export function PresidentHeader({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: session, isPending } = useSession();

  const currentSessionEmail = session?.user?.email || userEmail;

  const currentSection = (() => {
    if (pathname === "/president") return "My Proposals";
    if (pathname === "/president/new") return "New Proposal";
    if (pathname === "/president/archive") return "Archive";
    return "Event Proposals";
  })();

  // If session is null (signed out), redirect to home immediately
  React.useEffect(() => {
    if (!isPending && session === null) {
      router.push("/");
    }
  }, [isPending, session, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } finally {
      // Let useEffect handle redirect after session clears
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
              <div className="hidden md:block text-xs text-white/70 truncate ">
                {currentSection}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 ">
              <Link href="/president" onClick={() => setMenuOpen(false)}>
                <Button
                  variant={
                    isActive(pathname, "/president") ? "default" : "outline"
                  }
                  className="border-none h-9 text-white bg-slate-900 hover:bg-slate-900 hover:text-white"
                >
                  My Proposals
                </Button>
              </Link>
              <Link href="/president/new" onClick={() => setMenuOpen(false)}>
                <Button
                  variant={
                    isActive(pathname, "/president/new") ? "default" : "outline"
                  }
                  className="h-9 text-white bg-slate-900 hover:text-white hover:bg-salte-900 border-none"
                >
                 
               New Proposal
                </Button>
              </Link>
            </div>

            <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  className="hidden lg:inline-flex h-9 w-9 p-0 bg-transparent text-white hover:bg-transparent"
                  aria-label="Open account settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="fixed right-4 top-16 left-auto bottom-auto w-[18rem] max-w-[calc(100%-2rem)] translate-x-0 translate-y-0 rounded-none p-0">
                <div className="flex flex-col">
                  <div className="border-b border-border bg-slate-900 px-4 py-4 text-white">
                    <DialogTitle className="text-sm font-semibold tracking-wide">
                      Account
                    </DialogTitle>
                    <div className="mt-1 text-xs text-white/70 truncate">
                      {currentSessionEmail}
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/president/archive"
                      onClick={() => setAccountOpen(false)}
                      className="block"
                    >
                      <Button
                        variant={
                          isActive(pathname, "/president/archive")
                            ? "default"
                            : "ghost"
                        }
                        className="h-10 w-full justify-start rounded-none"
                      >
                        Archive
                      </Button>
                    </Link>
                  </div>

                  <div className="border-t border-border p-2">
                    <Button
                      onClick={() => {
                        setAccountOpen(false);
                        handleSignOut();
                      }}
                      className="h-10 w-full rounded-none"
                    >
                      Sign out
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  className="md:hidden h-9 w-9 p-0 bg-white text-slate-900 hover:bg-white/90"
                  aria-label="Open proposals menu"
                >
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="fixed right-0 top-0 left-auto bottom-0 h-dvh w-[20rem] max-w-[calc(100%-3rem)] translate-x-0 translate-y-0 rounded-none p-0 sm:max-w-[20rem]">
                <div className="flex h-full flex-col">
                  <div className="border-b border-border bg-slate-900 px-4 py-4 text-white">
                    <DialogTitle className="text-sm font-semibold tracking-wide">
                      Proposals Menu
                    </DialogTitle>
                  </div>

                  <nav aria-label="Proposals navigation" className="flex-1 p-2">
                    <Link
                      href="/president"
                      onClick={() => setMenuOpen(false)}
                      className="block"
                    >
                      <Button
                        variant={
                          isActive(pathname, "/president") ? "default" : "ghost"
                        }
                        className="h-10 w-full justify-start rounded-none"
                      >
                        My Proposals
                      </Button>
                    </Link>
                    <Link
                      href="/president/new"
                      onClick={() => setMenuOpen(false)}
                      className="block"
                    >
                      <Button
                        variant={
                          isActive(pathname, "/president/new")
                            ? "default"
                            : "ghost"
                        }
                        className="h-10 w-full justify-start rounded-none"
                      >
                        New Proposal 
                      </Button>
                    </Link>
                  </nav>

                  <div className="border-t border-border p-3">
                    <div className="text-xs text-muted-foreground px-1 pb-2">
                      Account
                    </div>
                    <div className="text-xs text-muted-foreground px-1 pb-3 truncate">
                      {currentSessionEmail}
                    </div>
                    <Link
                      href="/president/archive"
                      onClick={() => setMenuOpen(false)}
                      className="block"
                    >
                      <Button
                        variant={
                          isActive(pathname, "/president/archive")
                            ? "default"
                            : "outline"
                        }
                        className="h-10 w-full justify-start rounded-none"
                      >
                        Archive
                      </Button>
                    </Link>
                    <Button
                      onClick={() => {
                        setMenuOpen(false);
                        handleSignOut();
                      }}
                      className="h-10 w-full rounded-none mt-2"
                    >
                      Sign out
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
}
