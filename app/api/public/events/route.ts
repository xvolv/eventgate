import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVENTS_PER_PAGE = 5;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const upcomingPage = parseInt(searchParams.get("upcomingPage") || "0");
    const passedPage = parseInt(searchParams.get("passedPage") || "0");

    const now = new Date();

    // Fetch upcoming events (startTime in the future)
    const upcomingEvents = await prisma.event.findMany({
      where: {
        proposal: {
          status: "DIRECTOR_APPROVED",
        },
        startTime: {
          gt: now,
        },
      },
      orderBy: {
        startTime: "asc",
      },
      skip: upcomingPage * EVENTS_PER_PAGE,
      take: EVENTS_PER_PAGE,
      include: {
        proposal: {
          select: {
            id: true,
            club: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get total count for upcoming events
    const upcomingTotal = await prisma.event.count({
      where: {
        proposal: {
          status: "DIRECTOR_APPROVED",
        },
        startTime: {
          gt: now,
        },
      },
    });

    // Fetch passed events (endTime in the past)
    const passedEvents = await prisma.event.findMany({
      where: {
        proposal: {
          status: "DIRECTOR_APPROVED",
        },
        endTime: {
          lt: now,
        },
      },
      orderBy: {
        startTime: "desc",
      },
      skip: passedPage * EVENTS_PER_PAGE,
      take: EVENTS_PER_PAGE,
      include: {
        proposal: {
          select: {
            id: true,
            club: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get total count for passed events
    const passedTotal = await prisma.event.count({
      where: {
        proposal: {
          status: "DIRECTOR_APPROVED",
        },
        endTime: {
          lt: now,
        },
      },
    });

    // Format events with description
    const formatEvent = (event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      clubName: event.proposal.club.name,
      proposalId: event.proposal.id,
    });

    return NextResponse.json({
      upcoming: upcomingEvents.map(formatEvent),
      passed: passedEvents.map(formatEvent),
      pagination: {
        upcoming: {
          currentPage: upcomingPage,
          totalCount: upcomingTotal,
          totalPages: Math.ceil(upcomingTotal / EVENTS_PER_PAGE),
          hasMore: (upcomingPage + 1) * EVENTS_PER_PAGE < upcomingTotal,
        },
        passed: {
          currentPage: passedPage,
          totalCount: passedTotal,
          totalPages: Math.ceil(passedTotal / EVENTS_PER_PAGE),
          hasMore: (passedPage + 1) * EVENTS_PER_PAGE < passedTotal,
        },
      },
    });
  } catch (error) {
    console.error("Public events fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
