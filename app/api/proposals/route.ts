import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

type EventOccurrenceInput = {
  startTime: string;
  endTime: string;
  location?: string;
};

function parseOccurrences(body: any) {
  const raw = Array.isArray(body?.eventOccurrences)
    ? body.eventOccurrences
    : null;

  const occurrences: Array<{
    startTime: Date;
    endTime: Date;
    location: string;
  }> =
    raw && raw.length > 0
      ? raw.map((o: EventOccurrenceInput) => ({
          startTime: new Date(String(o?.startTime ?? "")),
          endTime: new Date(String(o?.endTime ?? "")),
          location: String(o?.location ?? body?.eventLocation ?? "").trim(),
        }))
      : [
          {
            startTime: new Date(String(body?.eventStartTime ?? "")),
            endTime: new Date(String(body?.eventEndTime ?? "")),
            location: String(body?.eventLocation ?? "").trim(),
          },
        ];

  return occurrences;
}

function validateOccurrences(
  occurrences: Array<{ startTime: Date; endTime: Date; location: string }>
) {
  if (!occurrences || occurrences.length === 0) {
    return "At least one event date/time is required";
  }

  for (const [idx, o] of occurrences.entries()) {
    if (
      Number.isNaN(o.startTime.getTime()) ||
      Number.isNaN(o.endTime.getTime())
    ) {
      return `Invalid date/time in session #${idx + 1}`;
    }
    if (o.endTime.getTime() <= o.startTime.getTime()) {
      return `End time must be after start time in session #${idx + 1}`;
    }
    if (!o.location) {
      return `Location is required in session #${idx + 1}`;
    }
  }

  // Disallow overlaps across all sessions (including same day)
  const sorted = [...occurrences].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.endTime.getTime() > next.startTime.getTime()) {
      return "Event sessions cannot overlap";
    }
  }

  return null;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;

  if (!user?.email) {
    console.info("[api/proposals][POST] unauthorized (no session)");
    return jsonNoStore({ message: "Unauthorized" }, { status: 401 });
  }

  if (!user.emailVerified) {
    console.info("[api/proposals][POST] forbidden (email not verified)", {
      email: user.email,
    });
    return jsonNoStore(
      { message: "Email verification required" },
      { status: 403 }
    );
  }

  // Check if user is a club president
  const userEmail = String(user.email).trim();
  const presidentGrant = await prisma.clubRoleGrant.findFirst({
    where: {
      email: { equals: userEmail, mode: "insensitive" },
      role: "PRESIDENT",
    },
    include: {
      club: true,
    },
  });

  if (!presidentGrant) {
    console.info("[api/proposals][POST] forbidden (not a club president)", {
      email: user.email,
    });
    return jsonNoStore(
      { message: "Only club presidents can submit proposals" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const occurrences = parseOccurrences(body);
    const occurrencesError = validateOccurrences(occurrences);
    if (occurrencesError) {
      return jsonNoStore({ message: occurrencesError }, { status: 400 });
    }

    const summaryStart = new Date(
      Math.min(...occurrences.map((o) => o.startTime.getTime()))
    );
    const summaryEnd = new Date(
      Math.max(...occurrences.map((o) => o.endTime.getTime()))
    );
    const summaryLocation = String(
      body?.eventLocation ?? occurrences[0]?.location ?? ""
    ).trim();

    // Create the proposal first
    const proposal = await prisma.proposal.create({
      data: {
        clubId: presidentGrant.clubId,
        submittedBy: user.email.toLowerCase(),
        status: "LEAD_REVIEW", // Start with lead review stage
      },
      include: {
        event: true,
        contacts: true,
        collaborators: true,
        guests: true,
        club: true,
      },
    });

    // Create the event with the proposalId
    const event = await prisma.event.create({
      data: {
        proposalId: proposal.id,
        title: body.eventTitle,
        description: body.eventDescription,
        location: summaryLocation,
        startTime: summaryStart,
        endTime: summaryEnd,
        occurrences: {
          create: occurrences.map((o) => ({
            startTime: o.startTime,
            endTime: o.endTime,
            location: o.location,
          })),
        },
      },
      include: { occurrences: true },
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

    // Create lead approval tracking entries for VP and Secretary only (not President)
    const clubLeads = await prisma.clubRoleGrant.findMany({
      where: {
        clubId: presidentGrant.clubId,
        role: {
          in: ["VP", "SECRETARY"], // Only VP and Secretary review proposals
        },
      },
      select: {
        role: true,
        email: true,
      },
    });

    // Create lead approval records
    if (clubLeads.length > 0) {
      await prisma.proposalLeadApproval.createMany({
        data: clubLeads.map((lead) => ({
          proposalId: proposal.id,
          leadRole: lead.role,
          leadEmail: lead.email,
          approved: false, // Initial state - not yet approved
        })),
      });
    }

    // Send notifications to club leads
    // TODO: Implement email notification system for club leads

    return jsonNoStore(
      {
        message:
          "Proposal submitted successfully and sent to club leads for review",
        proposal: {
          ...proposal,
          leadApprovals: clubLeads.map((lead) => ({
            leadRole: lead.role,
            leadEmail: lead.email,
            approved: false, // Initial state - not yet approved
            comments: null,
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Proposal submission error:", error);
    return jsonNoStore(
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
    console.info("[api/proposals][GET] unauthorized (no session)");
    return jsonNoStore({ message: "Unauthorized" }, { status: 401 });
  }

  if (!user.emailVerified) {
    console.info("[api/proposals][GET] forbidden (email not verified)", {
      email: user.email,
    });
    return jsonNoStore(
      { message: "Email verification required" },
      { status: 403 }
    );
  }

  // Check if user is a club president
  const userEmail = String(user.email).trim();
  const presidentGrant = await prisma.clubRoleGrant.findFirst({
    where: {
      email: { equals: userEmail, mode: "insensitive" },
      role: "PRESIDENT",
    },
    include: {
      club: true,
    },
  });

  if (!presidentGrant) {
    console.info("[api/proposals][GET] forbidden (not a club president)", {
      email: user.email,
    });
    return jsonNoStore(
      { message: "Only club presidents can view proposals" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any;
    const archived = searchParams.get("archived") === "1";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await prisma.proposal.deleteMany({
      where: {
        clubId: presidentGrant.clubId,
        archivedAt: { lt: cutoff },
      },
    });

    const where = {
      clubId: presidentGrant.clubId,
      ...(status && { status }),
      ...(archived ? { archivedAt: { not: null } } : { archivedAt: null }),
    };

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          event: { include: { occurrences: true } },
          contacts: true,
          collaborators: true,
          guests: true,
          club: {
            select: { name: true },
          },
          leadApprovals: {
            include: {
              proposal: {
                include: {
                  event: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.proposal.count({ where }),
    ]);

    return jsonNoStore({
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
    return jsonNoStore(
      {
        message: "Failed to fetch proposals",
      },
      { status: 500 }
    );
  }
}
