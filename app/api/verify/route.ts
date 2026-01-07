import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token) return NextResponse.redirect(new URL("/login?verified=0", request.url));

    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record) return NextResponse.redirect(new URL("/login?verified=0", request.url));

    if (record.expires < new Date()) {
      // expired, delete and notify
      await prisma.verificationToken.delete({ where: { id: record.id } });
      return NextResponse.redirect(new URL("/login?verified=0", request.url));
    }

    // mark verified
    await prisma.user.update({ where: { id: record.userId! }, data: { emailVerified: true } });
    await prisma.verificationToken.delete({ where: { id: record.id } });

    // redirect with success
    return NextResponse.redirect(new URL("/login?verified=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?verified=0", request.url));
  }
}
