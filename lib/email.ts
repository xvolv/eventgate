export async function sendVerificationEmail({
  to,
  token,
  baseUrl,
}: {
  to: string;
  token: string;
  baseUrl?: string | null;
}) {
  const appUrl =
    baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/api/verify?token=${encodeURIComponent(token)}`;

  const from = process.env.EMAIL_FROM || "noreply@yourapp.com";
  const subject = "Verify your email";
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
      <h2>Confirm your email</h2>
      <p>Thanks for signing up. Please confirm your email by clicking the link below:</p>
      <p><a href="${verifyUrl}" target="_blank" rel="noreferrer">Verify Email</a></p>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <code>${verifyUrl}</code>
      <p>This link will expire in 60 minutes.</p>
    </div>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.error(
      "[email] RESEND_API_KEY not set. Verification email not sent. Configure RESEND_API_KEY or provide a mail provider."
    );
    throw new Error("Email service not configured");
  }

  // Lazy-load Resend to keep this server-only and avoid bundling issues
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY as string);
  const result = await resend.emails.send({ to, from, subject, html });

  const err = (result as any)?.error ?? null;
  if (err) {
    console.error("[email] Resend send failed", err);
    throw new Error(
      typeof err?.message === "string"
        ? err.message
        : "Email provider reported an error while sending"
    );
  }

  const id = (result as any)?.data?.id ?? (result as any)?.id;
  if (!id) {
    console.error(
      "[email] Resend send returned unexpected payload (no id)",
      result
    );
    throw new Error("Email provider did not return a message id");
  }

  console.info("[email] Verification email enqueued", { to, id });
  return result;
}
