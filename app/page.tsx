import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HomeActions } from "./home-actions";
import { LandingHeader } from "@/components/landing-header";
import { PublicEvents } from "@/components/public-events";
import Image from "next/image";
import { CalendarCheck, ShieldCheck, ArrowRight } from "lucide-react";

async function getDashboardHref(email: string | null | undefined) {
  const safeEmail = (email || "").trim();
  if (!safeEmail) return "/president";

  const [systemRoleGrants, clubRoleGrants] = await Promise.all([
    prisma.systemRoleGrant.findMany({
      where: { email: { equals: safeEmail, mode: "insensitive" } },
      select: { role: true },
    }),
    prisma.clubRoleGrant.findMany({
      where: { email: { equals: safeEmail, mode: "insensitive" } },
      select: { role: true },
    }),
  ]);

  const systemRoles = systemRoleGrants.map((g) => g.role);
  const clubRoles = clubRoleGrants.map((g) => g.role);

  return systemRoles.includes("ADMIN")
    ? "/admin/clubs"
    : systemRoles.includes("STUDENT_UNION")
      ? "/student-union"
      : systemRoles.includes("DIRECTOR")
        ? "/director"
        : clubRoles.includes("VP")
          ? "/vp"
          : clubRoles.includes("SECRETARY")
            ? "/secretary"
            : "/president";
}

async function getPublicEvents() {
  const now = new Date();

  const [upcomingEvents, passedEvents] = await Promise.all([
    prisma.event.findMany({
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
    }),
    prisma.event.findMany({
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
    }),
  ]);

  const formatEvent = (event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    clubName: event.proposal.club.name,
  });

  return {
    upcomingEvents: upcomingEvents.map(formatEvent),
    passedEvents: passedEvents.map(formatEvent),
  };
}

export default async function HomePage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });

  const userEmail = session?.user?.email || "";
  if (session?.user && !session.user.emailVerified) {
    redirect("/verify?email=" + encodeURIComponent(userEmail));
  }

  const isAuthed = Boolean(session?.user);
  const isVerified = Boolean(session?.user?.emailVerified);
  const dashboardHref =
    isAuthed && isVerified
      ? await getDashboardHref(session?.user?.email)
      : "/president";

  const { upcomingEvents, passedEvents } = await getPublicEvents();

  return (
    <div className="min-h-svh bg-white">
      <LandingHeader userEmail={userEmail} />

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-0 min-h-130">
            {/* Left: Content */}
            <div className="flex flex-col justify-center py-12 lg:py-20 lg:pr-12">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-tight text-gray-900">
                AAU Campus{" "}
                <span style={{ color: "var(--aau-blue)" }}>Events</span>
              </h1>

              {/* Dual-color underline */}
              <div className="flex gap-0 mt-4 mb-6">
                <div
                  className="h-1 w-12 rounded-full"
                  style={{ backgroundColor: "var(--aau-red)" }}
                />
                <div
                  className="h-1 w-20 rounded-full ml-1"
                  style={{ backgroundColor: "var(--aau-blue)" }}
                />
              </div>

              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
                Discover upcoming events happening across Addis Ababa University
                campus. Stay informed about clubs, activities, and campus life.
              </p>

              <HomeActions
                isAuthed={isAuthed}
                isVerified={isVerified}
                userEmail={userEmail}
                dashboardHref={dashboardHref}
              />
            </div>

            {/* Right: Hero image with decorative shape */}
            <div className="relative hidden lg:flex items-center justify-center py-10">
              {/* Background decorative circle */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-[480px] rounded-full opacity-10"
                style={{ backgroundColor: "var(--aau-blue)" }}
              />
              {/* Decorative ring */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border-2 opacity-20"
                style={{ borderColor: "var(--aau-blue)" }}
              />

              {/* Main image — circular crop like AAU site */}
              <div className="relative w-[400px] h-[400px] rounded-full overflow-hidden shadow-2xl border-4 border-white z-10">
                <Image
                  src="/hero-campus.png"
                  alt="Addis Ababa University Campus"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Floating accent cards */}
              <div
                className="absolute top-12 right-4 bg-white rounded-lg shadow-lg px-4 py-3 z-20 flex items-center gap-3 border-l-4"
                style={{ borderColor: "var(--aau-red)" }}
              >
                <CalendarCheck
                  className="h-8 w-8"
                  style={{ color: "var(--aau-red)" }}
                />
                <div>
                  <div className="text-sm font-bold text-gray-900">Campus</div>
                  <div className="text-xs text-gray-500">Activities</div>
                </div>
              </div>

              <div
                className="absolute bottom-16 left-0 bg-white rounded-lg shadow-lg px-4 py-3 z-20 flex items-center gap-3 border-l-4"
                style={{ borderColor: "var(--aau-blue)" }}
              >
                <ShieldCheck
                  className="h-8 w-8"
                  style={{ color: "var(--aau-blue)" }}
                />
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    Discover Events
                  </div>
                  <div className="text-xs text-gray-500">
                    Explore Campus Life
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile hero image fallback */}
        <div className="lg:hidden relative w-full h-[240px] overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundColor: "var(--aau-blue)" }}
          />
          <Image
            src="/hero-campus.png"
            alt="Addis Ababa University Campus"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>
      </section>

      {/* ===== CAMPUS LIFE IMAGE STRIP ===== */}
      <section className="relative overflow-hidden">
        <div className="grid grid-cols-3 h-[200px] sm:h-[260px]">
          <div className="relative overflow-hidden">
            <Image
              src="/hero-campus.png"
              alt="Campus Life"
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,86,145,0.3)" }}
            />
          </div>
          <div className="relative overflow-hidden">
            <Image
              src="/hero-event.png"
              alt="University Event"
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(200,16,46,0.2)" }}
            />
          </div>
          <div className="relative overflow-hidden">
            <Image
              src="/hero-students.png"
              alt="Students Collaborating"
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,86,145,0.3)" }}
            />
          </div>
        </div>
      </section>

      {/* ===== EVENTS SECTION ===== */}
      <section id="events" className="py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <PublicEvents
            initialUpcomingEvents={upcomingEvents}
            initialPassedEvents={passedEvents}
          />
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        id="about"
        className="text-white"
        style={{ backgroundColor: "var(--aau-blue-dark)" }}
      >
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Column 1: Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="https://aau.edu.et/images/logoWhite.svg"
                  alt="AAU Logo"
                  className="h-40 w-auto object-contain"
                />
                <div>
                  <div className="font-bold text-lg">EventGate</div>
                  <div className="text-xs text-white/60">
                    Addis Ababa University
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h4 className="font-semibold text-sm mb-4 tracking-wider uppercase">
                Resources
              </h4>
              <div className="flex gap-0 mb-4">
                <div
                  className="h-[2px] w-6 rounded-full"
                  style={{ backgroundColor: "var(--aau-red)" }}
                />
                <div
                  className="h-[2px] w-10 rounded-full ml-0.5"
                  style={{ backgroundColor: "var(--aau-blue-light)" }}
                />
              </div>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li>
                  <a
                    href="https://www.aau.edu.et/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-3 w-3" /> AAU Website
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div>
              <h4 className="font-semibold text-sm mb-4 tracking-wider uppercase">
                Contact
              </h4>
              <div className="flex gap-0 mb-4">
                <div
                  className="h-[2px] w-6 rounded-full"
                  style={{ backgroundColor: "var(--aau-red)" }}
                />
                <div
                  className="h-[2px] w-10 rounded-full ml-0.5"
                  style={{ backgroundColor: "var(--aau-blue-light)" }}
                />
              </div>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li className="pt-1">
                  <a
                    href="mailto:info@aau.edu.et"
                    className="hover:text-white transition-colors"
                  >
                    info@aau.edu.et
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>© 2026 Addis Ababa University. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
