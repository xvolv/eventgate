"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { signUp, getSession, signOut, useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const rawSignupContact = process.env.NEXT_PUBLIC_SIGNUP_CONTACT;
  const signupContact = rawSignupContact
    ? rawSignupContact
        .replace(/\r?\n/g, " ")
        .replace(/^\s*['\"]|['\"]\s*$/g, "")
        .trim()
    : "";
  const passwordsMatch = password.length > 0 && password === repeatPassword;
  const passwordTooShort = password.length > 0 && password.length < 8;
  const showMismatch = repeatPassword.length > 0 && !passwordsMatch;

  // Do not auto-redirect away from sign-up; middleware protects private routes
  const { data: session, isPending } = useSession();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordTooShort) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      // If a session exists, sign out before creating a new account (avoids 422)
      const existing = await getSession();
      const existingData = "data" in existing ? existing.data : null;
      if (existingData?.user) {
        await signOut();
      }

      const result = await signUp.email({ email, password, name: fullName });

      // Check if signup failed or returned an error
      if (result.error) {
        const errorMessage = result.error.message || "Something went wrong";
        if (/restricted|not registered|not allowed/i.test(errorMessage)) {
          setError(
            signupContact ? `${errorMessage} ${signupContact}` : errorMessage
          );
          return;
        }
        if (/already|exists|registered|duplicate/i.test(errorMessage)) {
          // Check if user is verified or not via API
          try {
            const checkRes = await fetch("/api/auth/check-user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });
            const checkData = await checkRes.json();

            if (checkData.exists && !checkData.verified) {
              // User exists but not verified - redirect to verify page
              router.push("/verify?email=" + encodeURIComponent(email));
              return;
            }
          } catch {}

          // User exists and is verified
          setError(
            "An account with this email already exists. Please sign in instead."
          );
          return;
        }
        setError(errorMessage);
        return;
      }

      // Immediately clear any session created by sign-up; verification required first
      try {
        await signOut();
      } catch {}

      // Trigger verification email
      try {
        await fetch("/api/verify/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      } catch {}

      // Redirect to verification page
      router.push("/verify?email=" + encodeURIComponent(email));
    } catch (err: any) {
      // Surface better-auth error response when available
      const message =
        err?.data?.message || err?.message || "Something went wrong";
      if (/restricted|not registered|not allowed/i.test(message)) {
        setError(signupContact ? `${message} ${signupContact}` : message);
        return;
      }
      if (/already|exists|registered|duplicate/i.test(message)) {
        // Check if user is verified or not
        try {
          const checkRes = await fetch("/api/auth/check-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const checkData = await checkRes.json();

          if (checkData.exists && !checkData.verified) {
            // User exists but not verified - redirect to verify page
            router.push("/verify?email=" + encodeURIComponent(email));
            return;
          }
        } catch {}

        setError(
          "An account with this email already exists. Please sign in instead."
        );
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-gray-600 flex justify-center">
              Create Account
            </CardTitle>
            <CardDescription className="font-serif">
              EventGate Event Proposal System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="focus-visible:ring-0 rounded-none shadow-none"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus-visible:ring-0 rounded-none shadow-none"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus-visible:ring-0 rounded-none shadow-none"
                />
                {passwordTooShort && (
                  <p className="text-xs text-destructive">
                    Password must be at least 8 characters.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Confirm Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="focus-visible:ring-0 rounded-none shadow-none"
                />
                {showMismatch && (
                  <p className="text-xs text-destructive">
                    Passwords do not match.
                  </p>
                )}
                {passwordsMatch && repeatPassword.length > 0 && (
                  <p className="text-xs text-emerald-600">Passwords match.</p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
