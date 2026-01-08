"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";

interface Guest {
  name: string;
  affiliation: string;
  reason: string;
}

interface ProposalData {
  eventTitle: string;
  eventDescription: string;
  eventDates: string[];
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  collaboratingOrgs: string[];
  invitedGuests: Guest[];
  presidentName: string;
  presidentMobile: string;
  vpName: string;
  secretaryName: string;
}

export default function SubmitProposalPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  const [formData, setFormData] = useState<ProposalData>({
    eventTitle: "",
    eventDescription: "",
    eventDates: [""],
    eventStartTime: "",
    eventEndTime: "",
    eventLocation: "",
    collaboratingOrgs: [""],
    invitedGuests: [],
    presidentName: user?.name || "",
    presidentMobile: "",
    vpName: "",
    secretaryName: "",
  });

  useEffect(() => {
    if (!message && !error) return;
    setToastOpen(true);
    const handle = setTimeout(() => setToastOpen(false), 4000);
    return () => clearTimeout(handle);
  }, [message, error]);

  const addDate = () => {
    setFormData((prev) => ({
      ...prev,
      eventDates: [...prev.eventDates, ""],
    }));
  };

  const removeDate = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      eventDates: prev.eventDates.filter((_, i) => i !== index),
    }));
  };

  const updateDate = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      eventDates: prev.eventDates.map((date, i) =>
        i === index ? value : date
      ),
    }));
  };

  const addCollaboratingOrg = () => {
    setFormData((prev) => ({
      ...prev,
      collaboratingOrgs: [...prev.collaboratingOrgs, ""],
    }));
  };

  const removeCollaboratingOrg = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      collaboratingOrgs: prev.collaboratingOrgs.filter((_, i) => i !== index),
    }));
  };

  const updateCollaboratingOrg = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      collaboratingOrgs: prev.collaboratingOrgs.map((org, i) =>
        i === index ? value : org
      ),
    }));
  };

  const addGuest = () => {
    setFormData((prev) => ({
      ...prev,
      invitedGuests: [
        ...prev.invitedGuests,
        { name: "", affiliation: "", reason: "" },
      ],
    }));
  };

  const removeGuest = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      invitedGuests: prev.invitedGuests.filter((_, i) => i !== index),
    }));
  };

  const updateGuest = (index: number, field: keyof Guest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      invitedGuests: prev.invitedGuests.map((guest, i) =>
        i === index ? { ...guest, [field]: value } : guest
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "Failed to submit proposal");
        return;
      }

      setMessage(
        "Proposal submitted successfully! It will be reviewed by the Student Union."
      );
      // Reset form
      setFormData({
        eventTitle: "",
        eventDescription: "",
        eventDates: [""],
        eventStartTime: "",
        eventEndTime: "",
        eventLocation: "",
        collaboratingOrgs: [""],
        invitedGuests: [],
        presidentName: user?.name || "",
        presidentMobile: "",
        vpName: "",
        secretaryName: "",
      });
    } catch (err) {
      setError("An error occurred while submitting the proposal");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.emailVerified) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardContent className="text-center py-10">
            <h1 className="text-2xl font-semibold mb-4">
              Email Verification Required
            </h1>
            <p className="text-muted-foreground">
              Please verify your email before submitting proposals.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Submit Event Proposal</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event Information */}
        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="eventTitle">1.1 Event Title</Label>
              <Input
                id="eventTitle"
                value={formData.eventTitle}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    eventTitle: e.target.value,
                  }))
                }
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eventDescription">1.2 Event Description</Label>
              <textarea
                id="eventDescription"
                value={formData.eventDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    eventDescription: e.target.value,
                  }))
                }
                placeholder="Please provide specific details of your event"
                className="w-full min-h-[120px] p-3 border border-input bg-background text-sm"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>1.3 Event Date(s)</Label>
              {formData.eventDates.map((date, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => updateDate(index, e.target.value)}
                    required
                  />
                  {formData.eventDates.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeDate(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addDate}>
                Add Date
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="eventStartTime">1.4 Event Start Time</Label>
                <Input
                  id="eventStartTime"
                  type="time"
                  value={formData.eventStartTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      eventStartTime: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="eventEndTime">Event End Time</Label>
                <Input
                  id="eventEndTime"
                  type="time"
                  value={formData.eventEndTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      eventEndTime: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eventLocation">1.5 Event Location</Label>
              <textarea
                id="eventLocation"
                value={formData.eventLocation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    eventLocation: e.target.value,
                  }))
                }
                placeholder="Please provide details of room/halls required for the event"
                className="w-full min-h-[80px] p-3 border border-input bg-background text-sm"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* External Collaboration */}
        <Card>
          <CardHeader>
            <CardTitle>External Collaboration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label>
                1.6 Name and Address of Collaborating Organizations outside AAU
                (if any)
              </Label>
              {formData.collaboratingOrgs.map((org, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={org}
                    onChange={(e) =>
                      updateCollaboratingOrg(index, e.target.value)
                    }
                    placeholder="Organization name and address"
                  />
                  {formData.collaboratingOrgs.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeCollaboratingOrg(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addCollaboratingOrg}
              >
                Add Organization
              </Button>
            </div>

            <div className="grid gap-2">
              <Label>1.7 Name of Invited Guests outside AAU (if any)</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Please provide guest details for security review. ID information
                will only be requested after approval.
              </p>
              {formData.invitedGuests.map((guest, index) => (
                <div
                  key={index}
                  className="border border-border p-4 rounded-lg space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Guest Name</Label>
                      <Input
                        value={guest.name}
                        onChange={(e) =>
                          updateGuest(index, "name", e.target.value)
                        }
                        placeholder="Full name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Affiliation</Label>
                      <Input
                        value={guest.affiliation}
                        onChange={(e) =>
                          updateGuest(index, "affiliation", e.target.value)
                        }
                        placeholder="Organization/Institution"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Reason for Attending</Label>
                      <Input
                        value={guest.reason}
                        onChange={(e) =>
                          updateGuest(index, "reason", e.target.value)
                        }
                        placeholder="Purpose of attendance"
                      />
                    </div>
                  </div>
                  {formData.invitedGuests.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeGuest(index)}
                    >
                      Remove Guest
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addGuest}>
                Add Guest
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>2. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              The following are held responsible for the event
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>1. President Name</Label>
                <Input
                  value={formData.presidentName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      presidentName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>2. President Mobile No</Label>
                <Input
                  type="tel"
                  value={formData.presidentMobile}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      presidentMobile: e.target.value,
                    }))
                  }
                  placeholder="Mobile number"
                />
              </div>
              <div className="grid gap-2">
                <Label>3. Secretary Name</Label>
                <Input
                  value={formData.secretaryName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      secretaryName: e.target.value,
                    }))
                  }
                  placeholder="Secretary name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-center">
          <Button type="submit" disabled={loading} className="px-8">
            {loading ? "Submitting..." : "Submit Proposal"}
          </Button>
        </div>
      </form>

      {/* Toast Notification */}
      {(message || error) && toastOpen && (
        <div
          className="fixed bottom-4 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)]"
          role="status"
          aria-live={error ? "assertive" : "polite"}
        >
          <div
            className={
              error
                ? "border border-destructive/30 bg-background"
                : "border border-border bg-background"
            }
          >
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div
                  className={
                    error
                      ? "text-sm font-medium text-destructive"
                      : "text-sm font-medium text-foreground"
                  }
                >
                  {error ? "Submission failed" : "Success"}
                </div>
                <div
                  className={
                    error
                      ? "mt-1 text-sm text-destructive/90"
                      : "mt-1 text-sm text-muted-foreground"
                  }
                >
                  {error || message}
                </div>
              </div>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label="Dismiss"
                onClick={() => setToastOpen(false)}
              >
                ×
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
