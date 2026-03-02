"use client";

import { useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PublicEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  clubName: string;
}

interface PaginationInfo {
  currentPage: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

function formatEventDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(dateString: string) {
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = date.getDate();
  return { month, day };
}

function EventCard({
  event,
  isPast = false,
}: {
  event: PublicEvent;
  isPast?: boolean;
}) {
  const { month, day } = formatShortDate(event.startTime);

  return (
    <div
      className={`group flex gap-0 rounded-lg overflow-hidden border ${
        isPast
          ? "border-gray-200 bg-gray-50/50 opacity-80"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Date badge */}
      <div
        className="flex flex-col items-center justify-center px-4 py-3 min-w-[72px] text-white"
        style={{ backgroundColor: isPast ? "#94a3b8" : "var(--aau-red)" }}
      >
        <span className="text-[11px] font-bold tracking-wider uppercase">
          {month}
        </span>
        <span className="text-2xl font-bold leading-tight">{day}</span>
      </div>

      {/* Event info */}
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-base text-gray-900 truncate group-hover:text-[var(--aau-blue)] transition-colors">
              {event.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <Users className="h-3.5 w-3.5 text-[var(--aau-blue)] flex-shrink-0" />
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(0,86,145,0.08)",
                  color: "var(--aau-blue)",
                }}
              >
                {event.clubName}
              </span>
            </div>
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatEventDate(event.startTime)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </span>
        </div>
      </div>
    </div>
  );
}

/* Section title component with AAU-style dual-color underline */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-gray-900">{children}</h3>
      <div className="flex gap-0 mt-2">
        <div
          className="h-[3px] w-10 rounded-full"
          style={{ backgroundColor: "var(--aau-red)" }}
        />
        <div
          className="h-[3px] w-16 rounded-full ml-1"
          style={{ backgroundColor: "var(--aau-blue)" }}
        />
      </div>
    </div>
  );
}

/* Pagination controls */
function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) {
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-500">
        Page {currentPage + 1} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev || isLoading}
          className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext || isLoading}
          className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/* Events slider - shows events in chunks of 4 */
function EventsSlider({
  events,
  isPast = false,
}: {
  events: PublicEvent[];
  isPast?: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const EVENTS_PER_PAGE = 4;
  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);

  const currentEvents = events.slice(
    currentIndex * EVENTS_PER_PAGE,
    (currentIndex + 1) * EVENTS_PER_PAGE,
  );

  const goToPage = (pageIndex: number) => {
    if (pageIndex === currentIndex || pageIndex < 0 || pageIndex >= totalPages)
      return;
    setCurrentIndex(pageIndex);
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No {isPast ? "past " : ""}events to display
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current page events - fixed min height to prevent layout shift */}
      <div className="space-y-3" style={{ minHeight: "340px" }}>
        {currentEvents.map((event) => (
          <EventCard key={event.id} event={event} isPast={isPast} />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentIndex}
          totalPages={totalPages}
          onPageChange={goToPage}
          isLoading={false}
        />
      )}
    </div>
  );
}

export function PublicEvents({
  initialUpcomingEvents,
  initialPassedEvents,
}: {
  initialUpcomingEvents: PublicEvent[];
  initialPassedEvents: PublicEvent[];
  initialPagination?: {
    upcoming: PaginationInfo;
    passed: PaginationInfo;
  };
}) {
  // For now, we'll work with the initial events passed from the server
  // In a full implementation, you might want to fetch additional pages from the API

  if (initialUpcomingEvents.length === 0 && initialPassedEvents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No events to display yet.</p>
      </div>
    );
  }

  return (
    <>
      {initialUpcomingEvents.length > 0 && (
        <div>
          <SectionTitle>Upcoming Events</SectionTitle>
          <EventsSlider events={initialUpcomingEvents} />
        </div>
      )}

      {initialPassedEvents.length > 0 && (
        <div className={initialUpcomingEvents.length > 0 ? "mt-10" : ""}>
          <SectionTitle>Past Events</SectionTitle>
          <EventsSlider events={initialPassedEvents} isPast />
        </div>
      )}
    </>
  );
}
