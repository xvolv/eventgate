"use client";
export const dynamic = "force-dynamic";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut } from "@/lib/auth-client";

function VerifyPageContent() {
  const search = useSearchParams();
  const router = useRouter();
  const email = search.get("email") || "";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canResend = useMemo(() => email && /.+@.+\..+/.test(email), [email]);

  async function handleResend() {
    if (!canResend) return;
    // Cooldown: 30s between sends
    if (lastSentAt && Date.now() - lastSentAt < 30_000) {
      setErrorMessage("Please wait 30 seconds before resending.");
      return;
    }
    setStatus("sending");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to send verification email");
      }
      
      setStatus("sent");
      setLastSentAt(Date.now());
    } catch (e: any) {
      setStatus("error");
      setErrorMessage("Failed to send verification email. Please try again.");
    }
  }

  async function handleBack() {
    try {
      await signOut();
    } catch {}
    router.push("/login");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-gray-600 flex justify-center">
              Verify Your Email
            </CardTitle>
            <CardDescription className="font-serif text-center">
              {email || "your email"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
              <p className="font-semibold mb-2">📧 Check your inbox</p>
              <p className="text-muted-foreground">
                We sent a verification link to your email. Click the link in the email to verify your account.
              </p>
            </div>

            {status === "sent" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
                <p className="text-emerald-700 text-sm">
                  ✅ Verification email sent! Check your inbox and spam folder.
                </p>
              </div>
            )}

            {status === "error" && errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-700 text-sm">❌ {errorMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the email?
              </p>
              <Button
                onClick={handleResend}
                disabled={!canResend || status === "sending"}
                className="w-full rounded-none"
                variant="outline"
              >
                {status === "sending"
                  ? "Sending..."
                  : "Resend verification email"}
              </Button>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-3">
                After clicking the verification link in your email, you&apos;ll be redirected back here to sign in.
              </p>
              <Button variant="ghost" className="w-full rounded-none" onClick={handleBack}>
                Back to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}