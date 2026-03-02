"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function LandingHeader({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: session } = useSession();

  const currentSessionEmail = session?.user?.email || userEmail;
  const isAuthed = Boolean(currentSessionEmail);

  const currentSection = "Welcome";

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } finally {
      // Let useEffect handle redirect after session clears
    }
  };

  return (
    <header role="banner" className="sticky top-0 z-30 w-full">
      {/* Main header bar */}
      <div className="w-full text-gray-900 shadow-sm bg-white border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-2 lg:px-8">
          {/* Left: Logo + Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="https://aau.edu.et/images/aauLogo.png"
              alt="AAU Logo"
              className="h-12 w-auto object-contain"
            />
            <div className="h-10 w-0.5 mx-1 bg-cyan-700" />
            <div className="min-w-0">
              <div className="font-bold text-lg sm:text-xl tracking-wide leading-tight">
                EventGate
              </div>
              <div className="text-[11px] sm:text-xs text-gray-500 tracking-wider uppercase">
                Addis Ababa University
              </div>
            </div>
          </Link>

          {/* Right: Account (only show if logged in) */}
          <div className="flex items-center gap-2">
            {isAuthed && (
              <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    className="hidden md:inline-flex h-9 px-3 gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md border border-gray-200"
                    aria-label="Open account settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="fixed right-4 top-16 left-auto bottom-auto w-[18rem] max-w-[calc(100%-2rem)] translate-x-0 translate-y-0 rounded-none p-0">
                  <div className="flex flex-col">
                    <div
                      className="px-5 py-4 text-white"
                      style={{ backgroundColor: "var(--aau-blue)" }}
                    >
                      <DialogTitle className="text-sm font-semibold tracking-wide">
                        Account
                      </DialogTitle>
                      <div className="mt-1.5 text-xs text-white/70 truncate">
                        {currentSessionEmail}
                      </div>
                    </div>
                    <div className="p-3 bg-white">
                      <Button
                        onClick={() => {
                          setAccountOpen(false);
                          handleSignOut();
                        }}
                        variant="outline"
                        className="h-10 w-full rounded-md gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        Sign out
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
