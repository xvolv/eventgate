import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { addMinutes } from "date-fns";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond generically to avoid account enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ ok: true });
    }

    // Invalidate previous tokens for this identifier
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = addMinutes(new Date(), 10);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
        userId: user.id,
      },
    });

    await sendVerificationEmail({
      to: email,
      token,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[verify/send] failed to send verification email", e);
    return NextResponse.json(
      { message: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
