"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
}

const statusColors = {
  LEAD_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-300",
  LEAD_APPROVED: "bg-green-100 text-green-800 border-green-300",
  LEAD_REJECTED: "bg-red-100 text-red-800 border-red-300",
  PENDING: "bg-blue-100 text-blue-800 border-blue-300",
  SU_APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  SU_REJECTED: "bg-red-100 text-red-800 border-red-300",
  DIRECTOR_APPROVED: "bg-purple-100 text-purple-800 border-purple-300",
  DIRECTOR_REJECTED: "bg-red-100 text-red-800 border-red-300",
  RESUBMISSION_REQUIRED: "bg-orange-100 text-orange-800 border-orange-300",
};

const statusLabels = {
  LEAD_REVIEW: "Under Lead Review",
  LEAD_APPROVED: "Lead Approved",
  LEAD_REJECTED: "Lead Rejected",
  PENDING: "Pending Student Union Review",
  SU_APPROVED: "Student Union Approved",
  SU_REJECTED: "Student Union Rejected",
  DIRECTOR_APPROVED: "Director Approved",
  DIRECTOR_REJECTED: "Director Rejected",
  RESUBMISSION_REQUIRED: "Resubmission Required",
};

export default function SecretaryPage() {
  const { data, isPending } = useSession();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isPending) return;

    const fetchProposals = async () => {
      try {
        const response = await fetch("/api/lead-approvals");
        if (!response.ok) {
          throw new Error("Failed to fetch proposals");
        }
        const data = await response.json();
        setProposals(data.approvals || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch proposals"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [isPending]);

  const handleApproval = async (proposalId: string, approved: boolean) => {
    setApproving(proposalId);
    try {
      const response = await fetch("/api/lead-approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposalId,
          approved,
          comments: comments[proposalId] || "",
          leadRole: "SECRETARY",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit approval");
      }

      // Refresh the proposals list
      const fetchResponse = await fetch("/api/lead-approvals");
      const data = await fetchResponse.json();
      setProposals(data.approvals || []);

      // Clear comments for this proposal
      setComments((prev) => ({ ...prev, [proposalId]: "" }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit approval"
      );
    } finally {
      setApproving(null);
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
              There are no proposals pending your review at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {proposals.map((proposal) => (
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
                      statusColors[proposal.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[proposal.status as keyof typeof statusLabels]}
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
                                      {ethiopian ? `LT: [${ethiopian}]` : null}
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
                      Lead Review Status
                    </h4>
                    <div className="space-y-3">
                      {proposal.leadApprovals.map((approval, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-none"
                        >
                          <div>
                            <p className="font-medium">{approval.leadRole}</p>
                            <p className="text-sm text-muted-foreground">
                              {approval.leadEmail}
                            </p>
                          </div>
                          <Badge
                            className={
                              approval.approved
                                ? "bg-green-100 text-green-800 border-green-300"
                                : "bg-yellow-100 text-yellow-800 border-yellow-300"
                            }
                          >
                            {approval.approved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                      ))}
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

                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor={`comments-${proposal.id}`}>Comments</Label>
                    <Textarea
                      id={`comments-${proposal.id}`}
                      placeholder="Add your comments (optional)"
                      value={comments[proposal.id] || ""}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          [proposal.id]: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApproval(proposal.id, true)}
                      disabled={approving === proposal.id}
                      className="rounded-none"
                    >
                      {approving === proposal.id ? "Submitting..." : "Approve"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleApproval(proposal.id, false)}
                      disabled={approving === proposal.id}
                      className="rounded-none"
                    >
                      {approving === proposal.id ? "Submitting..." : "Reject"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
