"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

function isActive(pathname: string, href: string) {
  if (href === "/admin/clubs") {
    return pathname === "/admin" || pathname === "/admin/clubs";
  }
  return pathname === href;
}

export function AdminHeader({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      router.push("/");
    }
  };

  return (
    <header className="border-b border-border bg-background/60 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold text-lg">
            EventGate
          </Link>
          <span className="text-sm text-muted-foreground">Admin</span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/admin/clubs">
              <Button
                variant={
                  isActive(pathname, "/admin/clubs") ? "default" : "outline"
                }
                className="rounded-none"
              >
                Clubs
              </Button>
            </Link>
            <Link href="/admin/clubs/new">
              <Button
                variant={
                  isActive(pathname, "/admin/clubs/new") ? "default" : "outline"
                }
                className="rounded-none"
              >
                Add Club
              </Button>
            </Link>
            <Link href="/admin/system-roles">
              <Button
                variant={
                  isActive(pathname, "/admin/system-roles")
                    ? "default"
                    : "outline"
                }
                className="rounded-none"
              >
                System Roles
              </Button>
            </Link>
          </nav>

          <span className="hidden md:inline text-sm text-muted-foreground">
            {userEmail}
          </span>

          <Button onClick={handleSignOut} className="rounded-none">
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
