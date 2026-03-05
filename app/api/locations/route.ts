import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint to get all active locations for the proposal form
export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        capacity: true,
      },
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { message: "Failed to fetch locations" },
      { status: 500 },
    );
  }
}
