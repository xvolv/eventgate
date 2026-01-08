"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signOut, useSession } from "@/lib/auth-client";

function isActive(pathname: string, href: string) {
  if (href === "/admin/clubs") {
    return pathname === "/admin" || pathname === "/admin/clubs";
  }
  return pathname === href;
}

export function AdminHeader({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  const currentSessionEmail = session?.user?.email || userEmail;

  const currentSection = (() => {
    if (pathname === "/admin" || pathname === "/admin/clubs") return "Clubs";
    if (pathname === "/admin/clubs/new") return "Add Club";
    if (pathname === "/admin/system-roles") return "System Roles";
    if (pathname === "/admin/users") return "Users";
    return "Admin";
  })();

  // If session is null (signed out), redirect to home immediately
  React.useEffect(() => {
    if (session === null) {
      router.push("/");
    }
  }, [session, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      // Let the useEffect handle redirect after session clears
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
                Administration Portal
              </div>
              <div className="hidden md:block text-xs text-white/70 truncate">
                {currentSection}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block text-xs text-white/70 truncate max-w-[28rem]">
              {currentSessionEmail}
            </div>
            <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  className="md:hidden h-9 w-9 p-0 bg-white text-slate-900 hover:bg-white/90"
                  aria-label="Open admin menu"
                >
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="fixed right-0 top-0 left-auto bottom-0 h-dvh w-[20rem] max-w-[calc(100%-3rem)] translate-x-0 translate-y-0 rounded-none p-0 sm:max-w-[20rem]">
                <div className="flex h-full flex-col">
                  <div className="border-b border-border bg-slate-900 px-4 py-4 text-white">
                    <DialogTitle className="text-sm font-semibold tracking-wide">
                      Admin Menu
                    </DialogTitle>
                    <div className="mt-1 text-xs text-white/70 truncate">
                      {currentSessionEmail}
                    </div>
                  </div>

                  <nav aria-label="Admin navigation" className="flex-1 p-2">
                    <Link
                      href="/admin/clubs"
                      onClick={() => setMenuOpen(false)}
                      className="block"
                    >
                      <Button
                        variant={
                          isActive(pathname, "/admin/clubs")
                            ? "default"
                            : "ghost"
                        }
                        className="h-10 w-full justify-start rounded-none"
                      >
                        Clubs
                      </Button>
                    </Link>
                    <Link
                      href="/admin/clubs/new"
                      onClick={() => setMenuOpen(false)}
                      className="block"
                    >
                      <Button
                        variant={
                          isActive(pathname, "/admin/clubs/new")
                            ? "default"
                            : "ghost"
                        }
                        className="h-10 w-full justify-start rounded-none"
                      >
                        Add Club
                      </Button>
                    </Link>
                    <Link
                      href="/admin/system-roles"
                      onClick={() => setMenuOpen(false)}
                      className="block"
                    >
                      <Button
                        variant={
                          isActive(pathname, "/admin/system-roles")
                            ? "default"
                            : "ghost"
                        }
                        className="h-10 w-full justify-start rounded-none"
                      >
                        System Roles
                      </Button>
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={() => setMenuOpen(false)}
                      className="block"
                    >
                      <Button
                        variant={
                          isActive(pathname, "/admin/users")
                            ? "default"
                            : "ghost"
                        }
                        className="h-10 w-full justify-start rounded-none"
                      >
                        Users
                      </Button>
                    </Link>
                  </nav>

                  <div className="border-t border-border p-3">
                    <Button
                      onClick={() => {
                        setMenuOpen(false);
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
            <Button
              onClick={handleSignOut}
              variant="secondary"
              className="hidden md:inline-flex h-9 bg-white text-slate-900 hover:bg-white/90"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full bg-background">
        <div className="container mx-auto px-4">
          <nav
            id="admin-nav"
            aria-label="Admin navigation"
            className="hidden py-3 md:flex md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Link href="/admin/clubs" onClick={() => setMenuOpen(false)}>
                <Button
                  variant={
                    isActive(pathname, "/admin/clubs") ? "default" : "outline"
                  }
                  className="h-9 w-full justify-start md:w-auto"
                >
                  Clubs
                </Button>
              </Link>
              <Link href="/admin/clubs/new" onClick={() => setMenuOpen(false)}>
                <Button
                  variant={
                    isActive(pathname, "/admin/clubs/new")
                      ? "default"
                      : "outline"
                  }
                  className="h-9 w-full justify-start md:w-auto"
                >
                  Add Club
                </Button>
              </Link>
              <Link
                href="/admin/system-roles"
                onClick={() => setMenuOpen(false)}
              >
                <Button
                  variant={
                    isActive(pathname, "/admin/system-roles")
                      ? "default"
                      : "outline"
                  }
                  className="h-9 w-full justify-start md:w-auto"
                >
                  System Roles
                </Button>
              </Link>
              <Link href="/admin/users" onClick={() => setMenuOpen(false)}>
                <Button
                  variant={
                    isActive(pathname, "/admin/users") ? "default" : "outline"
                  }
                  className="h-9 w-full justify-start md:w-auto"
                >
                  Users
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
