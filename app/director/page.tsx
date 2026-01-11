"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDualTimeRange } from "@/lib/utils";

interface Proposal {
  id: string;
  status: string;
  createdAt: string;
  event: {
    title?: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    occurrences?: Array<{
      startTime?: string;
      endTime?: string;
      location?: string | null;
    }>;
  };
  collaborators: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  guests: Array<{
    id: string;
    name: string;
    affiliation: string | null;
    reason: string | null;
  }>;
  club: {
    name: string;
  };
  leadApprovals: Array<{
    leadRole: string;
    leadEmail: string;
    approved: boolean;
    comments?: string;
  }>;
  reviews?: Array<{
    reviewerEmail: string;
    recommendation: string | null;
    comments: string | null;
    updatedAt: string;
  }>;
}

const statusColors = {
  SU_APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  DIRECTOR_APPROVED: "bg-purple-100 text-purple-800 border-purple-300",
  DIRECTOR_REJECTED: "bg-red-100 text-red-800 border-red-300",
} as const;

export default function DirectorPage() {
  const { data, isPending } = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<{
    proposalId: string;
    action: "approve" | "reject";
  } | null>(null);
  const [comments, setComments] = useState<{ [key: string]: string }>({});

  const fetchProposals = async () => {
    try {
      const response = await fetch("/api/proposals/director");
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Failed to fetch proposals");
      }
      const body = await response.json();
      setProposals(body.proposals || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch proposals"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPending) return;
    fetchProposals();
  }, [isPending]);

  const handleDecision = async (proposalId: string, approve: boolean) => {
    setActing({ proposalId, action: approve ? "approve" : "reject" });
    try {
      const response = await fetch(
        `/api/proposals/${proposalId}/director-review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directorApproval: approve ? "Approved" : "Rejected",
            directorComments: comments[proposalId] || "",
          }),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Failed to submit decision");
      }

      setComments((prev) => ({ ...prev, [proposalId]: "" }));
      await fetchProposals();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit decision"
      );
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading proposals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-5xl">
      {proposals.length === 0 ? (
        <Card className="shadow-none rounded-none">
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium mb-4">No Proposals to Review</h3>
            <p className="text-muted-foreground">
              There are no proposals pending Director review at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {proposals.map((proposal) => {
            const suReview = proposal.reviews?.[0];
            return (
              <Card key={proposal.id} className="shadow-none rounded-none">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {proposal.event?.title || "Untitled Proposal"}
                      </CardTitle>
                      <CardDescription>
                        {proposal.club.name} •{" "}
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${
                        statusColors[
                          proposal.status as keyof typeof statusColors
                        ] || "bg-muted text-foreground"
                      }`}
                    >
                      {proposal.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Event Details
                      </h4>
                      <div className="space-y-2">
                        <p>
                          <strong>Location:</strong>{" "}
                          {proposal.event?.location || "Not specified"}
                        </p>
                        {Array.isArray(proposal.event?.occurrences) &&
                        proposal.event.occurrences.length > 1 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              <strong>Sessions:</strong>{" "}
                              {proposal.event.occurrences.length}
                            </p>
                            <div className="space-y-2">
                              {proposal.event.occurrences
                                .slice()
                                .sort(
                                  (a, b) =>
                                    new Date(a.startTime || 0).getTime() -
                                    new Date(b.startTime || 0).getTime()
                                )
                                .map((occ, idx) => {
                                  const { western, ethiopian } =
                                    formatDualTimeRange(
                                      occ.startTime,
                                      occ.endTime
                                    );
                                  return (
                                    <div
                                      key={idx}
                                      className="p-3 bg-muted/30 rounded"
                                    >
                                      <div className="text-sm">{western}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {ethiopian
                                          ? `LT: [${ethiopian}]`
                                          : null}
                                        {occ.location
                                          ? `${ethiopian ? " • " : ""}${
                                              occ.location
                                            }`
                                          : null}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ) : null}
                        <div>
                          <strong>Description:</strong>{" "}
                          <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                            {proposal.event?.description ||
                              "No description provided"}
                          </div>
                        </div>
                        <p>
                          <strong>Time:</strong>{" "}
                          {(() => {
                            const { western, ethiopian } = formatDualTimeRange(
                              proposal.event?.startTime,
                              proposal.event?.endTime
                            );
                            return ethiopian ? (
                              <span>
                                {western}
                                <span className="block text-xs text-muted-foreground">
                                  LT: [{ethiopian}]
                                </span>
                              </span>
                            ) : (
                              western
                            );
                          })()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Student Union Decision
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>Recommendation:</strong>{" "}
                          {suReview?.recommendation || "Recommended"}
                        </p>
                        {suReview?.comments ? (
                          <p>
                            <strong>Comments:</strong> {suReview.comments}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {proposal.collaborators?.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Collaborating Organizations
                      </h4>
                      <div className="space-y-2">
                        {proposal.collaborators.map((collaborator) => (
                          <div
                            key={collaborator.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="font-medium">
                              {collaborator.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {collaborator.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {proposal.guests?.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Invited Guests
                      </h4>
                      <div className="space-y-2">
                        {proposal.guests.map((guest) => (
                          <div
                            key={guest.id}
                            className="border border-border p-3 rounded"
                          >
                            <p className="text-sm">
                              <strong>Name:</strong> {guest.name}
                            </p>
                            <p className="text-sm">
                              <strong>Affiliation:</strong>{" "}
                              {guest.affiliation || "Not specified"}
                            </p>
                            <p className="text-sm">
                              <strong>Reason:</strong>{" "}
                              {guest.reason || "Not specified"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {proposal.status === "SU_APPROVED" && (
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor={`comments-${proposal.id}`}
                          className="text-sm font-medium"
                        >
                          Director Comments
                        </label>
                        <textarea
                          id={`comments-${proposal.id}`}
                          className="w-full min-h-[80px] px-3 py-2 text-sm border border-border rounded-md"
                          placeholder="Add decision notes..."
                          value={comments[proposal.id] || ""}
                          onChange={(e) =>
                            setComments((prev) => ({
                              ...prev,
                              [proposal.id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDecision(proposal.id, true)}
                          disabled={acting?.proposalId === proposal.id}
                          className="cursor-pointer"
                        >
                          {acting?.proposalId === proposal.id &&
                          acting.action === "approve"
                            ? "Approving..."
                            : "Approve"}
                        </Button>
                        <Button
                          onClick={() => handleDecision(proposal.id, false)}
                          disabled={acting?.proposalId === proposal.id}
                          variant="destructive"
                          className="cursor-pointer"
                        >
                          {acting?.proposalId === proposal.id &&
                          acting.action === "reject"
                            ? "Rejecting..."
                            : "Reject"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
