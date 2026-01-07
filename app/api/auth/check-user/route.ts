import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email || typeof email !== "string") {
      return NextResponse.json({ exists: false, verified: false });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ exists: false, verified: false });
    }

    return NextResponse.json({ 
      exists: true, 
      verified: Boolean(user.emailVerified) 
    });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json({ exists: false, verified: false });
  }
}
