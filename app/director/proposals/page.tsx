"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmation } from "@/components/ui/confirmation-card";

interface Proposal {
  id: string;
  eventTitle: string;
  eventDescription: string;
  eventDates: string[];
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  collaboratingOrgs: string[];
  invitedGuests: Array<{
    name: string;
    affiliation: string;
    reason: string;
  }>;
  presidentName: string;
  presidentMobile: string;
  vpName: string;
  secretaryName: string;
  status: string;
  suRecommendation?: string;
  suComments?: string;
  suApprovedBy?: string;
  suApprovedAt?: string;
  directorApproval?: string;
  directorComments?: string;
  submittedBy: string;
  createdAt: string;
}

export default function DirectorProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  const { requestConfirmation, ConfirmationComponent } = useConfirmation();

  useEffect(() => {
    if (!message && !error) return;
    setToastOpen(true);
    const handle = setTimeout(() => setToastOpen(false), 4000);
    return () => clearTimeout(handle);
  }, [message, error]);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await fetch("/api/proposals/director");
      if (!res.ok) throw new Error("Failed to fetch proposals");

      const data = await res.json();
      setProposals(data.proposals || []);
    } catch (err) {
      setError("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proposalId: string, comments: string) => {
    const confirmed = await requestConfirmation(
      "Final Approval",
      "Are you sure you want to give final approval to this proposal? This will confirm the event.",
      () => {},
      { variant: "default", confirmText: "Approve", cancelText: "Cancel" }
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/proposals/${proposalId}/director-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directorApproval: "Approved",
          directorComments: comments,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "Failed to approve proposal");
        return;
      }

      setMessage("Proposal approved successfully. Event is confirmed.");
      fetchProposals(); // Refresh list
    } catch (err) {
      setError("Failed to approve proposal");
    }
  };

  const handleReject = async (proposalId: string, comments: string) => {
    const confirmed = await requestConfirmation(
      "Reject Proposal",
      "Are you sure you want to reject this proposal? The President will need to resubmit with changes.",
      () => {},
      { variant: "destructive", confirmText: "Reject", cancelText: "Cancel" }
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/proposals/${proposalId}/director-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directorApproval: "Not Approved",
          directorComments: comments,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "Failed to reject proposal");
        return;
      }

      setMessage("Proposal rejected. President will need to resubmit.");
      fetchProposals(); // Refresh list
    } catch (err) {
      setError("Failed to reject proposal");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading proposals...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <ConfirmationComponent />
      <h1 className="text-2xl font-semibold mb-6">
        Director - Final Proposals Review
      </h1>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">
              No proposals pending final review
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{proposal.eventTitle}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      proposal.status === "SU_APPROVED"
                        ? "bg-blue-100 text-blue-800"
                        : proposal.status === "DIRECTOR_APPROVED"
                        ? "bg-green-100 text-green-800"
                        : proposal.status === "DIRECTOR_REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {proposal.status.replace("_", " ")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Event Details</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Title:</strong> {proposal.eventTitle}
                      </p>
                      <p>
                        <strong>Description:</strong>{" "}
                        {proposal.eventDescription}
                      </p>
                      <p>
                        <strong>Dates:</strong> {proposal.eventDates.join(", ")}
                      </p>
                      <p>
                        <strong>Time:</strong> {proposal.eventStartTime} -{" "}
                        {proposal.eventEndTime}
                      </p>
                      <p>
                        <strong>Location:</strong> {proposal.eventLocation}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>President:</strong> {proposal.presidentName}
                      </p>
                      <p>
                        <strong>Mobile:</strong> {proposal.presidentMobile}
                      </p>
                      {proposal.vpName && (
                        <p>
                          <strong>VP:</strong> {proposal.vpName}
                        </p>
                      )}
                      {proposal.secretaryName && (
                        <p>
                          <strong>Secretary:</strong> {proposal.secretaryName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {proposal.collaboratingOrgs.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">
                      Collaborating Organizations
                    </h3>
                    <ul className="text-sm space-y-1">
                      {proposal.collaboratingOrgs.map((org, index) => (
                        <li key={index}>• {org}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {proposal.invitedGuests.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Invited Guests</h3>
                    <div className="text-sm space-y-2">
                      {proposal.invitedGuests.map((guest, index) => (
                        <div
                          key={index}
                          className="border border-border p-3 rounded"
                        >
                          <p>
                            <strong>Name:</strong> {guest.name}
                          </p>
                          <p>
                            <strong>Affiliation:</strong> {guest.affiliation}
                          </p>
                          <p>
                            <strong>Reason:</strong> {guest.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student Union Review Section */}
                <div className="border-l-4 border-blue-200 pl-4">
                  <h3 className="font-medium mb-2">Student Union Review</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Recommendation:</strong>
                      <span
                        className={
                          proposal.suRecommendation === "Recommended"
                            ? "text-green-600"
                            : proposal.suRecommendation === "Not Recommended"
                            ? "text-red-600"
                            : ""
                        }
                      >
                        {proposal.suRecommendation || "Not specified"}
                      </span>
                    </p>
                    {proposal.suComments && (
                      <p>
                        <strong>Comments:</strong> {proposal.suComments}
                      </p>
                    )}
                    {proposal.suApprovedAt && (
                      <p>
                        <strong>Reviewed on:</strong>{" "}
                        {new Date(proposal.suApprovedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {proposal.status === "SU_APPROVED" && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-4">Director Final Review</h3>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>
                          Comments (Room availability, time changes, etc.)
                        </Label>
                        <Textarea
                          id={`director-comments-${proposal.id}`}
                          placeholder="Enter your comments and reasoning..."
                          className="w-full min-h-[100px] p-3 border border-input bg-background text-sm"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const commentsTextarea = document.getElementById(
                              `director-comments-${proposal.id}`
                            ) as HTMLTextAreaElement;

                            handleApprove(
                              proposal.id,
                              commentsTextarea.value || ""
                            );
                          }}
                        >
                          Final Approval
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => {
                            const commentsTextarea = document.getElementById(
                              `director-comments-${proposal.id}`
                            ) as HTMLTextAreaElement;

                            handleReject(
                              proposal.id,
                              commentsTextarea.value || ""
                            );
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {(proposal.status === "DIRECTOR_APPROVED" ||
                  proposal.status === "DIRECTOR_REJECTED") && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">
                      Director Final Decision
                    </h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Decision:</strong>
                        <span
                          className={
                            proposal.directorApproval === "Approved"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {proposal.directorApproval || "Not specified"}
                        </span>
                      </p>
                      {proposal.directorComments && (
                        <p>
                          <strong>Comments:</strong> {proposal.directorComments}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                  {error ? "Action failed" : "Success"}
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
