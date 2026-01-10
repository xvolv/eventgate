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

export async function sendProposalStatusEmail({
  to,
  proposalId,
  eventTitle,
  subject,
  heading,
  message,
  actionLabel,
  actionPath,
  baseUrl,
}: {
  to: string;
  proposalId: string;
  eventTitle: string;
  subject: string;
  heading: string;
  message: string;
  actionLabel: string;
  actionPath: string;
  baseUrl?: string | null;
}) {
  const appUrl =
    baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const actionUrl = `${appUrl}${actionPath}`;

  const from = process.env.EMAIL_FROM || "noreply@yourapp.com";
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.5;">
      <h2>${heading}</h2>
      <p><strong>Event:</strong> ${eventTitle}</p>
      <p><strong>Proposal ID:</strong> ${proposalId}</p>
      <p>${message}</p>
      <p>
        <a href="${actionUrl}" target="_blank" rel="noreferrer" style="display: inline-block; padding: 10px 14px; background: #111827; color: white; text-decoration: none; border-radius: 6px;">
          ${actionLabel}
        </a>
      </p>
      <p style="color: #6b7280; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:</p>
      <code style="font-size: 12px;">${actionUrl}</code>
    </div>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.error(
      "[email] RESEND_API_KEY not set. Proposal status email not sent.",
      { to, proposalId }
    );
    return { skipped: true };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY as string);
    const result = await resend.emails.send({ to, from, subject, html });

    const err = (result as any)?.error ?? null;
    if (err) {
      console.error("[email] Resend send failed", err);
      return { skipped: false, ok: false, error: err };
    }

    const id = (result as any)?.data?.id ?? (result as any)?.id;
    console.info("[email] Proposal status email enqueued", {
      to,
      id,
      proposalId,
    });
    return { skipped: false, ok: true, id };
  } catch (e) {
    console.error("[email] Failed to send proposal status email", e);
    return { skipped: false, ok: false, error: e };
  }
}
