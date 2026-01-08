"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, isBefore } from "date-fns";
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

export default function NewProposalPage() {
  const { data, isPending } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  const [clubInfo, setClubInfo] = useState<{ id: string; name: string } | null>(
    null
  );
  const [officers, setOfficers] = useState<{
    president: { email: string; name: string | null } | null;
    vicePresident: { email: string; name: string | null } | null;
    secretary: { email: string; name: string | null } | null;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [presidentName, setPresidentName] = useState("");
  const [vpName, setVpName] = useState("");
  const [secretaryName, setSecretaryName] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([""]);
  const [guests, setGuests] = useState<
    Array<{ name: string; expertise: string; reason: string }>
  >([{ name: "", expertise: "", reason: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch club information on component mount
  useEffect(() => {
    if (isPending) return;

    const fetchClubInfo = async () => {
      try {
        const response = await fetch("/api/club", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setClubInfo(data.club);
          setOfficers(data.officers);

          // Auto-fill officer names if available
          if (data.officers.president?.name) {
            setPresidentName(data.officers.president.name);
          }
          if (data.officers.vicePresident?.name) {
            setVpName(data.officers.vicePresident.name);
          }
          if (data.officers.secretary?.name) {
            setSecretaryName(data.officers.secretary.name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch club info:", error);
      }
    };

    fetchClubInfo();
  }, [isPending]);

  useEffect(() => {
    if (isPending) return;

    const user = data?.user;

    if (!user) {
      // Not logged in - redirect to login
      router.replace("/login?redirect=" + encodeURIComponent("/proposals/new"));
      return;
    }

    if (!user.emailVerified) {
      // Not verified - redirect to verify page
      router.replace("/verify?email=" + encodeURIComponent(user.email || ""));
      return;
    }

    // User is authenticated and verified; route away if this isn't their dashboard.
    (async () => {
      try {
        const rolesRes = await fetch("/api/roles", { cache: "no-store" });
        if (rolesRes.ok) {
          const rolesJson = await rolesRes.json();
          const roles: string[] = Array.isArray(rolesJson?.systemRoles)
            ? rolesJson.systemRoles
            : [];

          if (roles.includes("ADMIN")) {
            router.replace("/admin");
            return;
          }

          if (roles.includes("STUDENT_UNION")) {
            router.replace("/student-union");
            return;
          }

          if (roles.includes("DIRECTOR")) {
            router.replace("/director");
            return;
          }
        }
      } finally {
        setIsChecking(false);
      }
    })();
  }, [data, isPending, router]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const normalizedTitle = title.trim();
    const normalizedLocation = location.trim();
    const normalizedDescription = description.trim();
    const normalizedPresidentName = presidentName.trim();

    if (!normalizedTitle) nextErrors.title = "Title is required.";
    if (!startDateTime)
      nextErrors.startDateTime = "Start date/time is required.";
    if (!endDateTime) nextErrors.endDateTime = "End date/time is required.";
    if (!normalizedLocation) nextErrors.location = "Location is required.";
    if (!normalizedDescription) nextErrors.description = "Summary is required.";
    if (!normalizedPresidentName)
      nextErrors.presidentName = "President name is required.";

    const start = startDateTime ? new Date(startDateTime) : null;
    const end = endDateTime ? new Date(endDateTime) : null;

    if (start && Number.isNaN(start.getTime())) {
      nextErrors.startDateTime = "Enter a valid start date/time.";
    }

    if (end && Number.isNaN(end.getTime())) {
      nextErrors.endDateTime = "Enter a valid end date/time.";
    }

    if (start && !Number.isNaN(start.getTime())) {
      const minStart = addDays(new Date(), 7);
      if (isBefore(start, minStart)) {
        nextErrors.startDateTime = "Event must be at least 7 days from now.";
      }
    }

    if (
      start &&
      end &&
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime())
    ) {
      if (end.getTime() <= start.getTime()) {
        nextErrors.endDateTime = "End date/time must be after the start.";
      }
    }

    // Validate guests
    guests.forEach((guest, index) => {
      if (guest.name.trim()) {
        if (!guest.expertise.trim()) {
          nextErrors[`guests.${index}.expertise`] =
            "Expertise is required when guest name is provided.";
        }
        if (!guest.reason.trim()) {
          nextErrors[`guests.${index}.reason`] =
            "Reason for invitation is required when guest name is provided.";
        }
      }
    });

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setFormError(null);
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFormError("Please fix the highlighted fields.");
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
          eventStartTime: startDateTime,
          eventEndTime: endDateTime,
          eventLocation: location.trim(),
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
        throw new Error(data.message || "Failed to submit proposal");
      }

      setMessage("Proposal submitted successfully!");
      // Reset form
      setTitle("");
      setStartDateTime("");
      setEndDateTime("");
      setLocation("");
      setDescription("");
      setPresidentName("");
      setVpName("");
      setSecretaryName("");
      setCollaborators([""]);
      setGuests([{ name: "", expertise: "", reason: "" }]);
      setErrors({});

      // Redirect after a delay
      setTimeout(() => {
        router.push("/proposals");
      }, 2000);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to submit proposal"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending || isChecking) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Checking your session...
        </p>
      </div>
    );
  }

  if (!clubInfo || !officers) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading club information...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold font-serif text-gray-700">
                Submit Event Proposal
              </h1>
              <p className="text-sm text-muted-foreground">
                Provide event details for review and approval.
              </p>
            </div>
            {clubInfo && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {clubInfo.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  President Account
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <Card className="shadow-none rounded-none">
          <CardHeader>
            <CardTitle className="text-xl">Event Details</CardTitle>
            <CardDescription>
              Fill out the information below to start the approval process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6">
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}

              {/* Club Information Display */}
              <div className="grid gap-2">
                <Label>Club</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-none">
                  {clubInfo ? (
                    <>
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      <span className="font-medium">{clubInfo.name}</span>
                      <span className="text-sm text-muted-foreground">
                        (Verified President)
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      Loading club information...
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g., Annual Budget Review Summit"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title)
                      setErrors((prev) => ({ ...prev, title: "" }));
                  }}
                  className="rounded-none shadow-none focus-visible:ring-0"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="startDateTime">Start Date &amp; Time</Label>
                  <Input
                    id="startDateTime"
                    type="datetime-local"
                    required
                    value={startDateTime}
                    onChange={(e) => {
                      setStartDateTime(e.target.value);
                      if (errors.startDateTime)
                        setErrors((prev) => ({ ...prev, startDateTime: "" }));
                    }}
                    className="rounded-none shadow-none focus-visible:ring-0"
                  />
                  {errors.startDateTime && (
                    <p className="text-xs text-destructive">
                      {errors.startDateTime}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endDateTime">End Date &amp; Time</Label>
                  <Input
                    id="endDateTime"
                    type="datetime-local"
                    required
                    value={endDateTime}
                    onChange={(e) => {
                      setEndDateTime(e.target.value);
                      if (errors.endDateTime)
                        setErrors((prev) => ({ ...prev, endDateTime: "" }));
                    }}
                    className="rounded-none shadow-none focus-visible:ring-0"
                  />
                  {errors.endDateTime && (
                    <p className="text-xs text-destructive">
                      {errors.endDateTime}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  required
                  placeholder="Conference Hall A"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location)
                      setErrors((prev) => ({ ...prev, location: "" }));
                  }}
                  className="rounded-none shadow-none focus-visible:ring-0"
                />
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="presidentName">President Name</Label>
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
                      className="rounded-none shadow-none focus-visible:ring-0 pr-10"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div
                        className="w-2 h-2 bg-emerald-600 rounded-full"
                        title={`Logged in: ${
                          officers.president?.name
                            ? officers.president.name + " • "
                            : ""
                        }${officers.president?.email || data?.user?.email}`}
                      ></div>
                    </div>
                  </div>
                  {officers.president && (
                    <p className="text-xs text-muted-foreground">
                      {officers.president.name
                        ? `${officers.president.name} • `
                        : ""}
                      {officers.president.email}
                    </p>
                  )}
                  {errors.presidentName && (
                    <p className="text-xs text-destructive">
                      {errors.presidentName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="vpName">Vice President Name</Label>
                  <div className="relative">
                    <Input
                      id="vpName"
                      placeholder="Jane Smith"
                      value={vpName}
                      onChange={(e) => setVpName(e.target.value)}
                      className="rounded-none shadow-none focus-visible:ring-0 pr-10"
                    />
                    {officers.vicePresident && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div
                          className="w-2 h-2 bg-emerald-600 rounded-full"
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
                    <p className="text-xs text-muted-foreground">
                      {officers.vicePresident.name
                        ? `${officers.vicePresident.name} • `
                        : ""}
                      {officers.vicePresident.email}
                    </p>
                  )}
                  {!officers.vicePresident && (
                    <p className="text-xs text-muted-foreground italic">
                      No Vice President registered
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="secretaryName">Secretary Name</Label>
                  <div className="relative">
                    <Input
                      id="secretaryName"
                      placeholder="Bob Johnson"
                      value={secretaryName}
                      onChange={(e) => setSecretaryName(e.target.value)}
                      className="rounded-none shadow-none focus-visible:ring-0 pr-10"
                    />
                    {officers.secretary && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div
                          className="w-2 h-2 bg-emerald-600 rounded-full"
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
                    <p className="text-xs text-muted-foreground">
                      {officers.secretary.name
                        ? `${officers.secretary.name} • `
                        : ""}
                      {officers.secretary.email}
                    </p>
                  )}
                  {!officers.secretary && (
                    <p className="text-xs text-muted-foreground italic">
                      No Secretary registered
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Summary</Label>
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
                  className="rounded-none shadow-none focus-visible:ring-0"
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Collaborators Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Collaborating Organizations
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCollaborators([...collaborators, ""])}
                    className="rounded-none"
                  >
                    Add Collaborator
                  </Button>
                </div>
                {collaborators.map((collaborator, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="e.g., Engineering Department"
                      value={collaborator}
                      onChange={(e) => {
                        const newCollaborators = [...collaborators];
                        newCollaborators[index] = e.target.value;
                        setCollaborators(newCollaborators);
                      }}
                      className="rounded-none shadow-none focus-visible:ring-0"
                    />
                    {collaborators.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newCollaborators = collaborators.filter(
                            (_, i) => i !== index
                          );
                          setCollaborators(
                            newCollaborators.length > 0
                              ? newCollaborators
                              : [""]
                          );
                        }}
                        className="rounded-none"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Guests Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Invited Guests
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setGuests([
                        ...guests,
                        { name: "", expertise: "", reason: "" },
                      ])
                    }
                    className="rounded-none"
                  >
                    Add Guest
                  </Button>
                </div>
                {guests.map((guest, index) => (
                  <Card key={index} className="shadow-none rounded-none border">
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor={`guest-name-${index}`}
                            className="text-sm"
                          >
                            Guest Name *
                          </Label>
                          <Input
                            id={`guest-name-${index}`}
                            placeholder="Dr. Jane Smith"
                            value={guest.name}
                            onChange={(e) => {
                              const newGuests = [...guests];
                              newGuests[index] = {
                                ...newGuests[index],
                                name: e.target.value,
                              };
                              setGuests(newGuests);
                              if (errors[`guests.${index}.name`]) {
                                setErrors((prev) => ({
                                  ...prev,
                                  [`guests.${index}.name`]: "",
                                }));
                              }
                            }}
                            className="rounded-none shadow-none focus-visible:ring-0"
                          />
                          {errors[`guests.${index}.name`] && (
                            <p className="text-xs text-destructive">
                              {errors[`guests.${index}.name`]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor={`guest-expertise-${index}`}
                            className="text-sm"
                          >
                            Area of Expertise *
                          </Label>
                          <Input
                            id={`guest-expertise-${index}`}
                            placeholder="e.g., Machine Learning, Finance"
                            value={guest.expertise}
                            onChange={(e) => {
                              const newGuests = [...guests];
                              newGuests[index] = {
                                ...newGuests[index],
                                expertise: e.target.value,
                              };
                              setGuests(newGuests);
                              if (errors[`guests.${index}.expertise`]) {
                                setErrors((prev) => ({
                                  ...prev,
                                  [`guests.${index}.expertise`]: "",
                                }));
                              }
                            }}
                            className="rounded-none shadow-none focus-visible:ring-0"
                          />
                          {errors[`guests.${index}.expertise`] && (
                            <p className="text-xs text-destructive">
                              {errors[`guests.${index}.expertise`]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor={`guest-reason-${index}`}
                            className="text-sm"
                          >
                            Reason for Invitation *
                          </Label>
                          <Input
                            id={`guest-reason-${index}`}
                            placeholder="e.g., Keynote speaker on AI ethics"
                            value={guest.reason}
                            onChange={(e) => {
                              const newGuests = [...guests];
                              newGuests[index] = {
                                ...newGuests[index],
                                reason: e.target.value,
                              };
                              setGuests(newGuests);
                              if (errors[`guests.${index}.reason`]) {
                                setErrors((prev) => ({
                                  ...prev,
                                  [`guests.${index}.reason`]: "",
                                }));
                              }
                            }}
                            className="rounded-none shadow-none focus-visible:ring-0"
                          />
                          {errors[`guests.${index}.reason`] && (
                            <p className="text-xs text-destructive">
                              {errors[`guests.${index}.reason`]}
                            </p>
                          )}
                        </div>
                      </div>
                      {guests.length > 1 && (
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newGuests = guests.filter(
                                (_, i) => i !== index
                              );
                              setGuests(
                                newGuests.length > 0
                                  ? newGuests
                                  : [{ name: "", expertise: "", reason: "" }]
                              );
                            }}
                            className="rounded-none"
                          >
                            Remove Guest
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {guests.length === 1 && guests[0].name === "" && (
                  <p className="text-sm text-muted-foreground italic">
                    No guests added. Click "Add Guest" to invite speakers or
                    special attendees.
                  </p>
                )}
              </div>

              {message && <p className="text-sm text-emerald-700">{message}</p>}

              <Button
                type="submit"
                className="w-full md:w-auto rounded-none"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Proposal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
