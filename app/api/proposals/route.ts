import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;

  if (!user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      { message: "Email verification required" },
      { status: 403 }
    );
  }

  // Check if user is a club president
  const presidentGrant = await prisma.clubRoleGrant.findFirst({
    where: {
      email: user.email.toLowerCase(),
      role: "PRESIDENT",
    },
    include: {
      club: true,
    },
  });

  if (!presidentGrant) {
    return NextResponse.json(
      { message: "Only club presidents can submit proposals" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Create the proposal first
    const proposal = await prisma.proposal.create({
      data: {
        clubId: presidentGrant.clubId,
        submittedBy: user.email.toLowerCase(),
        status: "PENDING",
      },
      include: {
        event: true,
        contacts: true,
        collaborators: true,
        guests: true,
      },
    });

    // Create the event with the proposalId
    const event = await prisma.event.create({
      data: {
        proposalId: proposal.id,
        title: body.eventTitle,
        description: body.eventDescription,
        location: body.eventLocation,
        startTime: new Date(body.eventStartTime),
        endTime: new Date(body.eventEndTime),
      },
    });

    // Update the proposal with the eventId
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { eventId: event.id },
    });

    // Create president contact (required)
    await prisma.proposalContact.create({
      data: {
        proposalId: proposal.id,
        role: "PRESIDENT",
        name: body.presidentName,
        email: user.email.toLowerCase(),
      },
    });

    // Create VP contact (optional)
    if (body.vpName && body.vpName.trim()) {
      await prisma.proposalContact.create({
        data: {
          proposalId: proposal.id,
          role: "VICE_PRESIDENT",
          name: body.vpName.trim(),
        },
      });
    }

    // Create secretary contact (optional)
    if (body.secretaryName && body.secretaryName.trim()) {
      await prisma.proposalContact.create({
        data: {
          proposalId: proposal.id,
          role: "SECRETARY",
          name: body.secretaryName.trim(),
        },
      });
    }

    // Create collaborators (if any)
    if (body.collaboratingOrgs && body.collaboratingOrgs.length > 0) {
      await prisma.proposalCollaborator.createMany({
        data: body.collaboratingOrgs
          .filter((org: string) => org.trim() !== "")
          .map((org: string) => ({
            proposalId: proposal.id,
            name: org.trim(),
            type: "Organization",
          })),
      });
    }

    // Create guests (if any)
    if (body.invitedGuests && body.invitedGuests.length > 0) {
      await prisma.proposalGuest.createMany({
        data: body.invitedGuests
          .filter((guest: any) => guest.name && guest.name.trim() !== "")
          .map((guest: any) => ({
            proposalId: proposal.id,
            name: guest.name.trim(),
            affiliation: guest.expertise?.trim() || null,
            reason: guest.reason?.trim() || null,
          })),
      });
    }

    // Send notification to Student Union members
    // TODO: Implement email notification system

    return NextResponse.json(
      {
        message: "Proposal submitted successfully",
        proposal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Proposal submission error:", error);
    return NextResponse.json(
      {
        message: "Failed to submit proposal",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;

  if (!user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      { message: "Email verification required" },
      { status: 403 }
    );
  }

  // Check if user is a club president
  const presidentGrant = await prisma.clubRoleGrant.findFirst({
    where: {
      email: user.email.toLowerCase(),
      role: "PRESIDENT",
    },
    include: {
      club: true,
    },
  });

  if (!presidentGrant) {
    return NextResponse.json(
      { message: "Only club presidents can view proposals" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = {
      clubId: presidentGrant.clubId,
      ...(status && { status }),
    };

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          event: true,
          contacts: true,
          collaborators: true,
          guests: true,
          club: {
            select: { name: true },
          },
        },
      }),
      prisma.proposal.count({ where }),
    ]);

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Proposals fetch error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch proposals",
      },
      { status: 500 }
    );
  }
}
