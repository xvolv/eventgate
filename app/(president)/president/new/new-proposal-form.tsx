"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Trash2, Users,User } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GuestModal } from "@/components/guest-modal";
import { CollaboratorModal } from "@/components/collaborator-modal";


type ClubInfo = { id: string; name: string };
type Officers = {
  president: { email: string; name: string | null } | null;
  vicePresident: { email: string; name: string | null } | null;
  secretary: { email: string; name: string | null } | null;
};
type LocationItem = { id: string; name: string };

const EMPTY_OFFICERS: Officers = {
  president: null,
  vicePresident: null,
  secretary: null,
};

const NEW_PROPOSAL_CACHE_TTL_MS = 60 * 1000;

let newProposalReferenceCache: {
  clubInfo: ClubInfo | null;
  officers: Officers;
  locations: LocationItem[];
  locationsLoaded: boolean;
  cachedAt: number;
} = {
  clubInfo: null,
  officers: EMPTY_OFFICERS,
  locations: [],
  locationsLoaded: false,
  cachedAt: 0,
};

export default function NewProposalForm({ userEmail }: { userEmail: string }) {
  const { data } = useSession();
  const router = useRouter();

  const minDateTimeValue = new Date().toISOString().slice(0, 16);
  const cacheIsFresh =
    Date.now() - newProposalReferenceCache.cachedAt < NEW_PROPOSAL_CACHE_TTL_MS;
  const hasCachedReferenceData =
    Boolean(newProposalReferenceCache.clubInfo) &&
    newProposalReferenceCache.locationsLoaded;

  type EventOccurrenceForm = {
    startDateTime: string;
    endDateTime: string;
    location: string;
    locationId: string;
  };

  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(
    cacheIsFresh ? newProposalReferenceCache.clubInfo : null,
  );
  const [officers, setOfficers] = useState<Officers>(
    cacheIsFresh ? newProposalReferenceCache.officers : EMPTY_OFFICERS,
  );
  const [title, setTitle] = useState("");
  const [occurrences, setOccurrences] = useState<EventOccurrenceForm[]>([
    { startDateTime: "", endDateTime: "", location: "", locationId: "" },
  ]);
  const [description, setDescription] = useState("");
  const [presidentName, setPresidentName] = useState("");
  const [vpName, setVpName] = useState("");
  const [secretaryName, setSecretaryName] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [guests, setGuests] = useState<
    Array<{ name: string; expertise: string; reason: string }>
  >([]);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  // Keep error toasts persistent; auto-dismiss only successes.
  useEffect(() => {
    if (!toast) return;
    if (toast.tone === "error") return;
    const handle = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(handle);
  }, [toast]);

  // Locations for dropdown
  const [locations, setLocations] = useState<LocationItem[]>(
    cacheIsFresh ? newProposalReferenceCache.locations : [],
  );
  const [locationsLoading, setLocationsLoading] = useState(
    !(cacheIsFresh && hasCachedReferenceData),
  );

  useEffect(() => {
    if (cacheIsFresh) {
      if (newProposalReferenceCache.clubInfo) {
        setClubInfo(newProposalReferenceCache.clubInfo);
      }
      setOfficers(newProposalReferenceCache.officers);
      if (newProposalReferenceCache.officers.president?.name) {
        const cachedPresidentName =
          newProposalReferenceCache.officers.president.name;
        setPresidentName((prev) => (prev.trim() ? prev : cachedPresidentName));
      }
      if (newProposalReferenceCache.officers.vicePresident?.name) {
        const cachedVpName =
          newProposalReferenceCache.officers.vicePresident.name;
        setVpName((prev) => (prev.trim() ? prev : cachedVpName));
      }
      if (newProposalReferenceCache.officers.secretary?.name) {
        const cachedSecretaryName =
          newProposalReferenceCache.officers.secretary.name;
        setSecretaryName((prev) => (prev.trim() ? prev : cachedSecretaryName));
      }
      if (newProposalReferenceCache.locationsLoaded) {
        setLocations(newProposalReferenceCache.locations);
        setLocationsLoading(false);
      }
      return;
    }

    let cancelled = false;

    const fetchClubInfo = async () => {
      try {
        const response = await fetch("/api/club", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (cancelled) return;
          const nextClubInfo = (data.club || null) as ClubInfo | null;
          const safeOfficers = (data.officers || EMPTY_OFFICERS) as Officers;
          setClubInfo(nextClubInfo);
          setOfficers(safeOfficers);

          if (safeOfficers.president?.name) {
            const presidentOfficerName = safeOfficers.president.name;
            setPresidentName((prev) =>
              prev.trim() ? prev : presidentOfficerName,
            );
          }
          if (safeOfficers.vicePresident?.name) {
            const vicePresidentOfficerName = safeOfficers.vicePresident.name;
            setVpName((prev) =>
              prev.trim() ? prev : vicePresidentOfficerName,
            );
          }
          if (safeOfficers.secretary?.name) {
            const secretaryOfficerName = safeOfficers.secretary.name;
            setSecretaryName((prev) =>
              prev.trim() ? prev : secretaryOfficerName,
            );
          }

          newProposalReferenceCache = {
            ...newProposalReferenceCache,
            clubInfo: nextClubInfo,
            officers: safeOfficers,
            cachedAt: Date.now(),
          };
        }
      } catch (error) {
        console.error("Failed to fetch club info:", error);
      }
    };
    fetchClubInfo();

    // Fetch locations for dropdown
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/locations", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (cancelled) return;
          const nextLocations = (data.locations || []) as LocationItem[];
          setLocations(nextLocations);
          newProposalReferenceCache = {
            ...newProposalReferenceCache,
            locations: nextLocations,
            locationsLoaded: true,
            cachedAt: Date.now(),
          };
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error);
      } finally {
        if (!cancelled) {
          setLocationsLoading(false);
        }
      }
    };
    fetchLocations();

    return () => {
      cancelled = true;
    };
  }, []);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedPresidentName = presidentName.trim();

    if (!normalizedTitle) nextErrors.title = "Title is required.";

    if (!occurrences || occurrences.length === 0) {
      nextErrors.occurrences = "At least one event session is required.";
    }

    occurrences.forEach((o, idx) => {
      const startKey = `occurrences.${idx}.startDateTime`;
      const endKey = `occurrences.${idx}.endDateTime`;
      const locationKey = `occurrences.${idx}.location`;

      if (!o.startDateTime)
        nextErrors[startKey] = "Start date/time is required.";
      if (!o.endDateTime) nextErrors[endKey] = "End date/time is required.";
      if (!String(o.location || "").trim()) {
        nextErrors[locationKey] = "Location is required.";
      }

      const start = o.startDateTime ? new Date(o.startDateTime) : null;
      const end = o.endDateTime ? new Date(o.endDateTime) : null;

      if (start && Number.isNaN(start.getTime())) {
        nextErrors[startKey] = "Enter a valid start date/time.";
      }

      if (end && Number.isNaN(end.getTime())) {
        nextErrors[endKey] = "Enter a valid end date/time.";
      }

      if (
        start &&
        end &&
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime())
      ) {
        if (end.getTime() <= start.getTime()) {
          nextErrors[endKey] = "End date/time must be after the start.";
        }
      }
    });

    const parsed = occurrences
      .map((o) => ({
        start: new Date(o.startDateTime),
        end: new Date(o.endDateTime),
      }))
      .filter(
        (o) =>
          !Number.isNaN(o.start.getTime()) && !Number.isNaN(o.end.getTime()),
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (parsed.length > 0) {
      for (let i = 0; i < parsed.length - 1; i++) {
        if (parsed[i].end.getTime() > parsed[i + 1].start.getTime()) {
          nextErrors.occurrences = "Event sessions cannot overlap.";
          break;
        }
      }
    }

    if (!normalizedDescription) nextErrors.description = "Summary is required.";
    if (!normalizedPresidentName)
      nextErrors.presidentName = "President name is required.";
    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setFormError(null);
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFormError("Please fix the highlighted fields.");
      const firstErrorMsg =
        nextErrors.occurrences ||
        nextErrors.title ||
        Object.values(nextErrors)[0];
      if (firstErrorMsg) {
        setToast({ message: firstErrorMsg, tone: "error" });
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventTitle: title.trim(),
          eventDescription: description.trim(),
          eventLocation: String(occurrences?.[0]?.location || "").trim(),
          eventLocationId: String(occurrences?.[0]?.locationId || ""),
          eventOccurrences: occurrences.map((o) => ({
            startTime: o.startDateTime,
            endTime: o.endDateTime,
            location: o.location,
            locationId: o.locationId,
          })),
          presidentName: presidentName.trim(),
          vpName: vpName.trim(),
          secretaryName: secretaryName.trim(),
          collaboratingOrgs: collaborators.filter((c) => c.trim() !== ""),
          invitedGuests: guests.filter((g) => g.name.trim() !== ""),
          clubId: clubInfo?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.message || "Failed to submit proposal";
        const conflictMsg =
          response.status === 409 && data?.conflict
            ? `${errMsg}: ${data.conflict.location} is booked from ${new Date(
                data.conflict.startTime,
              ).toLocaleString()} to ${new Date(
                data.conflict.endTime,
              ).toLocaleString()}`
            : errMsg;
        setToast({ message: conflictMsg, tone: "error" });
        throw new Error(conflictMsg);
      }

      setMessage(
        "Proposal submitted successfully and sent to club leads for review!",
      );
      setToast({
        message:
          "Proposal submitted and sent to leads. You’ll be redirected shortly.",
        tone: "success",
      });

      setTitle("");
      setOccurrences([{
        startDateTime: "", endDateTime: "", location: "",
        locationId: ""
      }]);
      setDescription("");
      setPresidentName("");
      setVpName("");
      setSecretaryName("");
      setCollaborators([]);
      setGuests([]);
      setErrors({});

      setTimeout(() => {
        router.push("/president");
      }, 2000);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to submit proposal",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateOccurrence = (
    index: number,
    patch: Partial<EventOccurrenceForm>,
  ) => {
    setOccurrences((prev) => {
      const next = [...prev];
      const current = next[index] ?? {
        startDateTime: "",
        endDateTime: "",
        location: "",
      };
      next[index] = { ...current, ...patch };
      return next;
    });
  };

  const addOccurrence = () => {
    setOccurrences((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          startDateTime: "",
          endDateTime: "",
          location: String(last?.location || "").trim(),
          locationId: String(last?.locationId || ""),
        },
      ];
    });
  };

  const removeOccurrence = (index: number) => {
    setOccurrences((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="min-h-svh bg-white">
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <Card className="border border-gray-200 rounded-none">
          <CardHeader className="pb-6">
            {/* Club name in caps */}
            {clubInfo && (
              <p className="text-sm font-semibold text-gray-500 tracking-widest uppercase mb-2">
                {clubInfo.name}
              </p>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div
                className="h-1 w-8 rounded-full"
                style={{ backgroundColor: "var(--aau-red)" }}
              ></div>
              <div
                className="h-1 w-12 rounded-full"
                style={{ backgroundColor: "var(--aau-blue)" }}
              ></div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Submit New Event Proposal
            </CardTitle>
            <CardDescription className="text-gray-600 flex items-center gap-1">
              <Info className="w-5 h-5" />
              Fill out the information below to submit your event for approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-8">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  {formError}
                </p>
              )}

              {/* Club Information Display */}

              <div className="grid gap-2">
                <Label htmlFor="title" className="text-gray-700 font-medium">
                  Event Title
                </Label>
                <Input
                  id="title"
                  required
                  placeholder="Machine learning intro to get you started"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title)
                      setErrors((prev) => ({ ...prev, title: "" }));
                  }}
                  className="rounded-none border-gray-200 focus:border-none focus:ring-(--aau-blue)"
                />
                {errors.title && (
                  <p className="text-xs text-red-600">{errors.title}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-gray-700 font-medium">
                    Event days
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOccurrence}
                    className="rounded-none border-(--aau-blue) text-(--aau-blue) "
                  >
                    + Add Another Day
                  </Button>
                </div>

                {errors.occurrences && (
                  <p className="text-xs text-red-600">{errors.occurrences}</p>
                )}

                <div className="space-y-4">
                  {occurrences.map((o, idx) => {
                    const startKey = `occurrences.${idx}.startDateTime`;
                    const endKey = `occurrences.${idx}.endDateTime`;
                    const locationKey = `occurrences.${idx}.location`;

                    return (
                      <div
                        key={idx}
                        className="p-5 border border-gray-200 bg-gray-50 rounded-none space-y-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-(--aau-blue) text-white text-sm flex items-center justify-center">
                              {idx + 1}
                            </span>
                            day {idx + 1}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOccurrence(idx)}
                            disabled={occurrences.length <= 1}
                            className="border-none rounded-none bg-gray-50 hover:bg-gray-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label
                              htmlFor={`startDateTime-${idx}`}
                              className="text-gray-700"
                            >
                              Start Date & Time
                            </Label>
                            <div className="relative">
                              <Input
                                id={`startDateTime-${idx}`}
                                type="datetime-local"
                                required
                                min={minDateTimeValue}
                                step={60}
                                value={o.startDateTime}
                                onChange={(e) => {
                                  updateOccurrence(idx, {
                                    startDateTime: e.target.value,
                                  });
                                  if (errors[startKey]) {
                                    setErrors((prev) => ({
                                      ...prev,
                                      [startKey]: "",
                                    }));
                                  }
                                }}
                                className={`rounded-none border-gray-200 focus:border-(--aau-blue) focus:ring-(--aau-blue) ${
                                  !o.startDateTime
                                    ? "text-transparent [&::-webkit-datetime-edit]:text-transparent [&::-webkit-datetime-edit-fields-wrapper]:text-transparent [&::-webkit-datetime-edit-ampm-field]:text-transparent [&::-webkit-datetime-edit-hour-field]:text-transparent [&::-webkit-datetime-edit-minute-field]:text-transparent [&::-webkit-datetime-edit-day-field]:text-transparent [&::-webkit-datetime-edit-month-field]:text-transparent [&::-webkit-datetime-edit-year-field]:text-transparent"
                                    : ""
                                }`}
                              />
                              {!o.startDateTime && (
                                <div className="pointer-events-none absolute inset-0 flex items-center px-3 text-sm text-black">
                                  Select date & time
                                </div>
                              )}
                            </div>
                            {errors[startKey] && (
                              <p className="text-xs text-red-600">
                                {errors[startKey]}
                              </p>
                            )}
                          </div>

                          <div className="grid gap-2 pt-4 sm:pt-0">
                            <Label
                              htmlFor={`endDateTime-${idx}`}
                              className="text-gray-700"
                            >
                              End Date & Time
                            </Label>
                            <div className="relative">
                              <Input
                                id={`endDateTime-${idx}`}
                                type="datetime-local"
                                required
                                min={minDateTimeValue}
                                step={60}
                                value={o.endDateTime}
                                onChange={(e) => {
                                  updateOccurrence(idx, {
                                    endDateTime: e.target.value,
                                  });
                                  if (errors[endKey]) {
                                    setErrors((prev) => ({
                                      ...prev,
                                      [endKey]: "",
                                    }));
                                  }
                                }}
                                className={`rounded-none border-gray-200 focus:border-(--aau-blue) focus:ring-(--aau-blue) ${
                                  !o.endDateTime
                                    ? "text-transparent [&::-webkit-datetime-edit]:text-transparent [&::-webkit-datetime-edit-fields-wrapper]:text-transparent [&::-webkit-datetime-edit-ampm-field]:text-transparent [&::-webkit-datetime-edit-hour-field]:text-transparent [&::-webkit-datetime-edit-minute-field]:text-transparent [&::-webkit-datetime-edit-day-field]:text-transparent [&::-webkit-datetime-edit-month-field]:text-transparent [&::-webkit-datetime-edit-year-field]:text-transparent"
                                    : ""
                                }`}
                              />
                              {!o.endDateTime && (
                                <div className="pointer-events-none absolute inset-0 flex items-center px-3 text-sm text-black">
                                  Select date & time
                                </div>
                              )}
                            </div>
                            {errors[endKey] && (
                              <p className="text-xs text-red-600">
                                {errors[endKey]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label
                            htmlFor={`location-${idx}`}
                            className="text-gray-700"
                          >
                            Location
                          </Label>
                          {locationsLoading ? (
                            <Input
                              id={`location-${idx}`}
                              disabled
                              placeholder="Loading locations..."
                              value=""
                              readOnly
                              className="rounded-lg border-gray-200"
                            />
                          ) : locations.length > 0 ? (
                            <select
                              id={`location-${idx}`}
                              value={o.locationId}
                              onChange={(e) => {
                                const nextId = e.target.value;
                                const nextLoc = locations.find(
                                  (loc) => loc.id === nextId,
                                );
                                updateOccurrence(idx, {
                                  locationId: nextId,
                                  location: nextLoc?.name || "",
                                });
                                if (errors[locationKey]) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    [locationKey]: "",
                                  }));
                                }
                              }}
                              className="w-full h-10 rounded-none border border-gray-200 bg-white px-3 py-2 text-sm focus:border-(--aau-blue) focus:outline-none focus:ring-1 focus:ring-(--aau-blue)"
                            >
                              <option value="">Select a location</option>
                              {locations.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                  {loc.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              id={`location-${idx}`}
                              required
                              placeholder="Conference Hall A"
                              value={o.location}
                              onChange={(e) => {
                                updateOccurrence(idx, {
                                  location: e.target.value,
                                  locationId: "",
                                });
                                if (errors[locationKey]) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    [locationKey]: "",
                                  }));
                                }
                              }}
                              className="rounded-lg border-gray-200 focus:border-(--aau-blue) focus:ring-(--aau-blue)"
                            />
                          )}
                          {errors[locationKey] && (
                            <p className="text-xs text-red-600">
                              {errors[locationKey]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label
                    htmlFor="presidentName"
                    className="text-gray-700 font-medium"
                  >
                    President Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="presidentName"
                      required
                      placeholder="John Doe"
                      value={presidentName}
                      onChange={(e) => {
                        setPresidentName(e.target.value);
                        if (errors.presidentName)
                          setErrors((prev) => ({ ...prev, presidentName: "" }));
                      }}
                      className="rounded-none border-gray-200 focus:border-(--aau-blue) focus:ring-(--aau-blue) pr-10"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "var(--aau-blue)" }}
                        title={`Logged in: ${
                          officers.president?.name
                            ? officers.president.name + " • "
                            : ""
                        }${officers.president?.email || data?.user?.email}`}
                      ></div>
                    </div>
                  </div>
                  {officers.president && (
                    <p className="text-xs text-gray-500">
                      {officers.president.name
                        ? `${officers.president.name} • `
                        : ""}
                      {officers.president.email}
                    </p>
                  )}
                  {errors.presidentName && (
                    <p className="text-xs text-red-600">
                      {errors.presidentName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="vpName" className="text-gray-700 font-medium">
                    Vice President Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="vpName"
                      placeholder="Jane Smith"
                      value={vpName}
                      onChange={(e) => setVpName(e.target.value)}
                      className="rounded-none border-gray-200 focus:border-(--aau-blue) focus:ring-(--aau-blue) pr-10"
                    />
                    {officers.vicePresident && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "var(--aau-blue)" }}
                          title={`Registered: ${
                            officers.vicePresident.name
                              ? officers.vicePresident.name + " • "
                              : ""
                          }${officers.vicePresident.email}`}
                        ></div>
                      </div>
                    )}
                  </div>
                  {officers.vicePresident && (
                    <p className="text-xs text-gray-500">
                      {officers.vicePresident.name
                        ? `${officers.vicePresident.name} • `
                        : ""}
                      {officers.vicePresident.email}
                    </p>
                  )}
                  {!officers.vicePresident && (
                    <p className="text-xs text-gray-400 italic">
                      No Vice President registered
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="secretaryName"
                    className="text-gray-700 font-medium"
                  >
                    Secretary Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="secretaryName"
                      placeholder="Bob Johnson"
                      value={secretaryName}
                      onChange={(e) => setSecretaryName(e.target.value)}
                      className="rounded-none border-gray-200 focus:border-(--aau-blue) focus:ring-(--aau-blue) pr-10"
                    />
                    {officers.secretary && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "var(--aau-blue)" }}
                          title={`Registered: ${
                            officers.secretary.name
                              ? officers.secretary.name + " • "
                              : ""
                          }${officers.secretary.email}`}
                        ></div>
                      </div>
                    )}
                  </div>
                  {officers.secretary && (
                    <p className="text-xs text-gray-500">
                      {officers.secretary.name
                        ? `${officers.secretary.name} • `
                        : ""}
                      {officers.secretary.email}
                    </p>
                  )}
                  {!officers.secretary && (
                    <p className="text-xs text-gray-400 italic">
                      No Secretary registered
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="description"
                  className="text-gray-700 font-medium"
                >
                  Event Description: Please provide Specific Details of your
                  event
                </Label>
                <Textarea
                  id="description"
                  required
                  rows={5}
                  placeholder="Describe the event objectives, attendees, and logistical needs."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description)
                      setErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  className="rounded-none border-gray-200 focus:border-(--aau-blue) focus:ring-(--aau-blue) h-52"
                />
                {errors.description && (
                  <p className="text-xs text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Collaborators Section */}
              <div className="space-y-4 p-5 rounded-none border border-gray-200">
                <div className="flex items-center justify-start gap-3">
                  <Label className="text-base font-semibold text-gray-800">
                    Collaborating Organizations
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCollaboratorModalOpen(true)}
                    className="rounded-none border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    + Collaborators
                    <Users  className="h-5 w-5"/>
                  </Button>
                </div>
                {collaborators.length > 0 ? (
                  <div className="space-y-2">
                    {collaborators.map((collaborator, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "var(--aau-blue)" }}
                        ></div>
                        <span className="text-sm text-gray-800">
                          {collaborator}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm w-0 text-gray-500 italic">
                  
                  </p>
                )}
              </div>

              {/* Guests Section */}
              <div className="space-y-4 p-5 rounded-none border border-gray-200">
                <div className="flex items-center justify-start gap-3">
                  <Label className="text-base font-semibold text-gray-800">
                    Invited Guests
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsGuestModalOpen(true)}
                    className="rounded-none border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    + Guests
                    <User className="w-5 h-5"/>
                  </Button>
                </div>
                {guests.length > 0 ? (
                  <div className="space-y-3">
                    {guests.map((guest, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-lg space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-2 h-2 rounded-full mt-2"
                            style={{ backgroundColor: "var(--aau-red)" }}
                          ></div>
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold text-gray-900">
                              {guest.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Expertise:</strong> {guest.expertise}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Reason:</strong> {guest.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm w-0 text-gray-500 italic">
                    
                  </p>
                )}
              </div>

              {message && (
                <p className="text-sm text-green-700 bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  {message}
                </p>
              )}

              <Button
                type="submit"
                className="w-full md:w-auto rounded-none text-white font-medium py-6"
                style={{ backgroundColor: "var(--aau-blue)" }}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Proposal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <GuestModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        guests={guests}
        onSave={setGuests}
      />

      <CollaboratorModal
        isOpen={isCollaboratorModalOpen}
        onClose={() => setIsCollaboratorModalOpen(false)}
        collaborators={collaborators}
        onSave={setCollaborators}
      />

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
          <div
            className={`border p-4 shadow-sm rounded-none ${
              toast.tone === "error"
                ? "border-red-300 bg-white"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <div
                  className={`text-sm font-semibold ${
                    toast.tone === "error" ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {toast.tone === "error" ? "Action needed" : "Success"}
                </div>
                <div className="text-sm text-gray-700 mt-1 break-words">
                  {toast.message}
                </div>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setToast(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
