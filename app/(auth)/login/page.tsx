"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn, useSession, getSession, signOut } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const verified = searchParams.get("verified");

  // Show verification success/failure message
  useEffect(() => {
    if (verified === "1") {
      setSuccessMessage("Email verified successfully! You can now sign in.");
    } else if (verified === "0") {
      setError("Verification failed or link expired. Please try again.");
    }
  }, [verified]);

  // No auto-redirect on visit; redirects are handled after explicit login
  const { data: session, isPending } = useSession();

  const getRolesWithRetry = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const rolesRes = await fetch("/api/roles", { cache: "no-store" });
        if (!rolesRes.ok) throw new Error("roles fetch failed");
        const roles = await rolesRes.json();
        const systemRoles: string[] = Array.isArray(roles?.systemRoles)
          ? roles.systemRoles
          : [];
        const clubRoles: string[] = Array.isArray(roles?.clubRoles)
          ? roles.clubRoles
          : [];
        return { systemRoles, clubRoles };
      } catch {
        // Small backoff in case session cookie/roles query lags behind.
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      }
    }
    return { systemRoles: [] as string[], clubRoles: [] as string[] };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const result = await signIn.email({ email, password });

      // Check for errors in the result
      if (result.error) {
        // Check if user exists but is unverified
        try {
          const checkRes = await fetch("/api/auth/check-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const checkData = await checkRes.json();

          if (checkData.exists && !checkData.verified) {
            // User exists but not verified - redirect to verify page
            await signOut().catch(() => {});
            router.push("/verify?email=" + encodeURIComponent(email));
            return;
          }
        } catch {}

        setError("Invalid email or password.");
        return;
      }

      // Check session to decide where to go
      const res = await getSession();
      const data = "data" in res ? res.data : null;
      const user = (data as any)?.user ?? (data as any)?.session?.user;

      if (user?.emailVerified) {
        const { systemRoles, clubRoles } = await getRolesWithRetry();

        if (systemRoles.includes("ADMIN")) {
          router.push("/admin");
          return;
        }

        if (systemRoles.includes("STUDENT_UNION")) {
          router.push("/student-union");
          return;
        }

        if (systemRoles.includes("DIRECTOR")) {
          router.push("/director");
          return;
        }

        if (clubRoles.includes("VP")) {
          router.push("/vp");
          return;
        }

        if (clubRoles.includes("SECRETARY")) {
          router.push("/secretary");
          return;
        }

        if (clubRoles.includes("PRESIDENT")) {
          router.push("/president");
          return;
        }

        if (redirectParam) {
          router.push(redirectParam);
          return;
        }

        router.push("/president");
      } else if (user) {
        await signOut();
        router.push("/verify?email=" + encodeURIComponent(email));
      } else {
        setError("Invalid email or password.");
      }
    } catch (err: any) {
      // Check if user exists but is unverified
      try {
        const checkRes = await fetch("/api/auth/check-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const checkData = await checkRes.json();

        if (checkData.exists && !checkData.verified) {
          // User exists but not verified - redirect to verify page
          await signOut().catch(() => {});
          router.push("/verify?email=" + encodeURIComponent(email));
          return;
        }
      } catch {}

      // Use a generic error to avoid revealing whether the user exists
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card className="shadow-none border-t border-r border-l border-b rounded-none">
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                focus-visible:ring-0 rounded-none shadow-none
                "
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  className=" outline-none focus-visible:ring-0 rounded-none shadow-none"
                  id="password"
                  type="password"
                  required
                  value={password}
                  placeholder="*******"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {successMessage && (
                <p className="text-sm text-emerald-600">{successMessage}</p>
              )}
              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
