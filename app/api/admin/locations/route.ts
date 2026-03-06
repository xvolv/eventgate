import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
    }

    const locations = await prisma.location.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { message: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
    }

    const body = await request.json();
    const { name, description, capacity } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { message: "Location name is required" },
        { status: 400 }
      );
    }

    // Check if location already exists
    const existingLocation = await prisma.location.findUnique({
      where: { name: name.trim() },
    });

    if (existingLocation) {
      return NextResponse.json(
        { message: "A location with this name already exists" },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        capacity: capacity ? parseInt(capacity, 10) : null,
      },
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { message: "Failed to create location" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
    }

    const body = await request.json();
    const { id, name, description, capacity, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Location ID is required" },
        { status: 400 }
      );
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { message: "Location not found" },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it conflicts
    if (name && name.trim() !== existingLocation.name) {
      const nameConflict = await prisma.location.findFirst({
        where: {
          name: name.trim(),
          id: { not: id },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { message: "A location with this name already exists" },
          { status: 400 }
        );
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(capacity !== undefined && { capacity: capacity ? parseInt(capacity, 10) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ location });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { message: "Failed to update location" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Location ID is required" },
        { status: 400 }
      );
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { message: "Location not found" },
        { status: 404 }
      );
    }

    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { message: "Failed to delete location" },
      { status: 500 }
    );
  }
}
