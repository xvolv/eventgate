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

  const [clubName, setClubName] = useState("");
  const [title, setTitle] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [vpEmail, setVpEmail] = useState("");
  const [secretaryEmail, setSecretaryEmail] = useState("");
  const [collaboratorsOrGuests, setCollaboratorsOrGuests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const normalizedVp = vpEmail.trim().toLowerCase();
    const normalizedSecretary = secretaryEmail.trim().toLowerCase();
    const normalizedClubName = clubName.trim();
    const normalizedTitle = title.trim();
    const normalizedLocation = location.trim();
    const normalizedDescription = description.trim();

    if (!normalizedClubName) nextErrors.clubName = "Club name is required.";
    if (!normalizedTitle) nextErrors.title = "Title is required.";
    if (!startDateTime)
      nextErrors.startDateTime = "Start date/time is required.";
    if (!endDateTime) nextErrors.endDateTime = "End date/time is required.";
    if (!normalizedLocation) nextErrors.location = "Location is required.";
    if (!normalizedDescription) nextErrors.description = "Summary is required.";

    if (!normalizedVp) nextErrors.vpEmail = "VP email is required.";
    else if (!normalizedVp.includes("@"))
      nextErrors.vpEmail = "Enter a valid email.";

    if (!normalizedSecretary)
      nextErrors.secretaryEmail = "Secretary email is required.";
    else if (!normalizedSecretary.includes("@"))
      nextErrors.secretaryEmail = "Enter a valid email.";

    if (
      normalizedVp &&
      normalizedSecretary &&
      normalizedVp === normalizedSecretary
    ) {
      nextErrors.secretaryEmail = "VP and Secretary must be different people.";
    }

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
      // TODO: Wire this to a real API endpoint when available
      await new Promise((resolve) => setTimeout(resolve, 600));
      setMessage("Proposal submitted (demo only).");
      setClubName("");
      setTitle("");
      setStartDateTime("");
      setEndDateTime("");
      setLocation("");
      setDescription("");
      setVpEmail("");
      setSecretaryEmail("");
      setCollaboratorsOrGuests("");
      setErrors({});
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

  return (
    <div className="min-h-svh bg-background">
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <h1 className="text-2xl font-semibold font-serif text-gray-700">
            Submit Event Proposal
          </h1>
          <p className="text-sm text-muted-foreground">
            Provide event details for review and approval.
          </p>
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

              <div className="grid gap-2">
                <Label htmlFor="clubName">Club Name</Label>
                <Input
                  id="clubName"
                  required
                  placeholder="e.g., Computer Science Society"
                  value={clubName}
                  onChange={(e) => {
                    setClubName(e.target.value);
                    if (errors.clubName)
                      setErrors((prev) => ({ ...prev, clubName: "" }));
                  }}
                  className="rounded-none shadow-none focus-visible:ring-0"
                />
                {errors.clubName && (
                  <p className="text-xs text-destructive">{errors.clubName}</p>
                )}
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
                  <Label htmlFor="vpEmail">Vice President (VP) Email</Label>
                  <Input
                    id="vpEmail"
                    type="email"
                    required
                    placeholder="vp@club.edu"
                    value={vpEmail}
                    onChange={(e) => {
                      setVpEmail(e.target.value);
                      if (errors.vpEmail)
                        setErrors((prev) => ({ ...prev, vpEmail: "" }));
                    }}
                    className="rounded-none shadow-none focus-visible:ring-0"
                  />
                  {errors.vpEmail && (
                    <p className="text-xs text-destructive">{errors.vpEmail}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="secretaryEmail">Secretary Email</Label>
                  <Input
                    id="secretaryEmail"
                    type="email"
                    required
                    placeholder="secretary@club.edu"
                    value={secretaryEmail}
                    onChange={(e) => {
                      setSecretaryEmail(e.target.value);
                      if (errors.secretaryEmail)
                        setErrors((prev) => ({ ...prev, secretaryEmail: "" }));
                    }}
                    className="rounded-none shadow-none focus-visible:ring-0"
                  />
                  {errors.secretaryEmail && (
                    <p className="text-xs text-destructive">
                      {errors.secretaryEmail}
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

              <div className="grid gap-2">
                <Label htmlFor="collaboratorsOrGuests">
                  Collaborators / Guests (optional)
                </Label>
                <Textarea
                  id="collaboratorsOrGuests"
                  rows={4}
                  placeholder="List collaborators, guests, or other involved parties."
                  value={collaboratorsOrGuests}
                  onChange={(e) => setCollaboratorsOrGuests(e.target.value)}
                  className="rounded-none shadow-none focus-visible:ring-0"
                />
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
