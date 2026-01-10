"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useSession } from "@/lib/auth-client";
import { GuestModal } from "@/components/guest-modal";
import { CollaboratorModal } from "@/components/collaborator-modal";

type ProposalResponse = {
  proposal: {
    id: string;
    status: string;
    event: {
      title: string;
      description: string;
      location: string;
      startTime: string;
      endTime: string;
    } | null;
    collaborators: Array<{ id: string; name: string; type: string }>;
    guests: Array<{
      id: string;
      name: string;
      affiliation: string | null;
      reason: string | null;
    }>;
    contacts: Array<{ role: string; name: string; email: string | null }>;
    reviews: Array<{
      reviewerRole: string;
      approved: boolean;
      comments: string | null;
    }>;
  };
};

const EDITABLE_STATUSES = new Set([
  "LEAD_REVIEW",
  "LEAD_APPROVED",
  "LEAD_REJECTED",
  "SU_REJECTED",
  "DIRECTOR_REJECTED",
  "RESUBMISSION_REQUIRED",
]);

export default function ProposalEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const proposalId = params?.id;

  const { data, isPending } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("");

  const [title, setTitle] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [location, setLocation] = useState("");
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

  const canEdit = useMemo(() => EDITABLE_STATUSES.has(status), [status]);

  const directorRejection = useMemo(() => {
    const found = (data: ProposalResponse | null) => {
      const review = data?.proposal?.reviews?.find(
        (r) => r.reviewerRole === "DIRECTOR"
      );
      if (!review || review.approved) return null;
      return review.comments || "";
    };
    return found;
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!proposalId) return;

    const user = data?.user;
    if (!user) {
      router.replace(
        "/login?redirect=" + encodeURIComponent(`/proposals/${proposalId}/edit`)
      );
      return;
    }

    if (!user.emailVerified) {
      router.replace("/verify?email=" + encodeURIComponent(user.email || ""));
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/proposals/${proposalId}`, {
          cache: "no-store",
        });
        const json = (await res
          .json()
          .catch(() => null)) as ProposalResponse | null;
        if (!res.ok) {
          throw new Error((json as any)?.message || "Failed to load proposal");
        }

        const proposal = json?.proposal;
        if (!proposal?.event) {
          throw new Error("Proposal is missing event details");
        }

        setStatus(proposal.status);
        setTitle(proposal.event.title || "");
        setLocation(proposal.event.location || "");
        setDescription(proposal.event.description || "");

        setStartDateTime(
          new Date(proposal.event.startTime).toISOString().slice(0, 16)
        );
        setEndDateTime(
          new Date(proposal.event.endTime).toISOString().slice(0, 16)
        );

        const president = proposal.contacts?.find(
          (c) => c.role === "PRESIDENT"
        );
        const vp = proposal.contacts?.find((c) => c.role === "VICE_PRESIDENT");
        const sec = proposal.contacts?.find((c) => c.role === "SECRETARY");
        setPresidentName(president?.name || "");
        setVpName(vp?.name || "");
        setSecretaryName(sec?.name || "");

        setCollaborators((proposal.collaborators || []).map((c) => c.name));
        setGuests(
          (proposal.guests || []).map((g) => ({
            name: g.name,
            expertise: g.affiliation || "",
            reason: g.reason || "",
          }))
        );

        if (!EDITABLE_STATUSES.has(proposal.status)) {
          setError(
            "Editing is not allowed once the proposal reaches Student Union."
          );
        }

        const directorReason = directorRejection(json);
        if (directorReason) {
          setMessage(`Director rejection reason: ${directorReason}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load proposal");
      } finally {
        setLoading(false);
      }
    })();
  }, [data, isPending, proposalId, router, directorRejection]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalId) return;
    if (!canEdit) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTitle: title,
          eventDescription: description,
          eventStartTime: startDateTime,
          eventEndTime: endDateTime,
          eventLocation: location,
          presidentName,
          vpName,
          secretaryName,
          collaboratingOrgs: collaborators,
          invitedGuests: guests,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || "Failed to update proposal");
      }

      setMessage("Saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update proposal");
    } finally {
      setSaving(false);
    }
  };

  const handleResubmit = async () => {
    if (!proposalId) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/proposals/${proposalId}/resubmit`, {
        method: "POST",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || "Failed to resubmit proposal");
      }

      setMessage("Resubmitted.");
      router.push("/proposals");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resubmit proposal");
    } finally {
      setSaving(false);
    }
  };

  if (loading || isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading proposal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <Card className="shadow-none rounded-none">
          <CardHeader>
            <CardTitle className="text-xl">Edit Proposal</CardTitle>
            <CardDescription>
              Status: <span className="font-medium">{status || "Unknown"}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(error || message) && (
              <div className="mb-4 space-y-2">
                {error && <p className="text-sm text-destructive">{error}</p>}
                {message && (
                  <p className="text-sm text-muted-foreground">{message}</p>
                )}
              </div>
            )}

            <form onSubmit={handleSave} className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  value={title}
                  disabled={!canEdit}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-none shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="startDateTime">Start Date &amp; Time</Label>
                  <Input
                    id="startDateTime"
                    type="datetime-local"
                    required
                    value={startDateTime}
                    disabled={!canEdit}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="rounded-none shadow-none focus-visible:ring-0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endDateTime">End Date &amp; Time</Label>
                  <Input
                    id="endDateTime"
                    type="datetime-local"
                    required
                    value={endDateTime}
                    disabled={!canEdit}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="rounded-none shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  required
                  value={location}
                  disabled={!canEdit}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded-none shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="presidentName">President Name</Label>
                <Input
                  id="presidentName"
                  required
                  value={presidentName}
                  disabled={!canEdit}
                  onChange={(e) => setPresidentName(e.target.value)}
                  className="rounded-none shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="vpName">Vice President Name</Label>
                  <Input
                    id="vpName"
                    value={vpName}
                    disabled={!canEdit}
                    onChange={(e) => setVpName(e.target.value)}
                    className="rounded-none shadow-none focus-visible:ring-0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="secretaryName">Secretary Name</Label>
                  <Input
                    id="secretaryName"
                    value={secretaryName}
                    disabled={!canEdit}
                    onChange={(e) => setSecretaryName(e.target.value)}
                    className="rounded-none shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Summary</Label>
                <Textarea
                  id="description"
                  required
                  rows={5}
                  value={description}
                  disabled={!canEdit}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-none shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Collaborating Organizations
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canEdit}
                    onClick={() => setIsCollaboratorModalOpen(true)}
                    className="rounded-none"
                  >
                    Manage Collaborators
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Invited Guests
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canEdit}
                    onClick={() => setIsGuestModalOpen(true)}
                    className="rounded-none"
                  >
                    Manage Guests
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Button
                  type="submit"
                  className="rounded-none"
                  disabled={saving || !canEdit}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>

                {(status === "LEAD_REJECTED" ||
                  status === "SU_REJECTED" ||
                  status === "DIRECTOR_REJECTED" ||
                  status === "RESUBMISSION_REQUIRED") && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none"
                    disabled={saving}
                    onClick={handleResubmit}
                  >
                    Resubmit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

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
    </div>
  );
}
