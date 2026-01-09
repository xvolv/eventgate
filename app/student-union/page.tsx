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
import { StudentUnionHeader } from "@/components/student-union-header";

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
  };
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

export default function StudentUnionPage() {
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
        const response = await fetch("/api/student-union-proposals");
        if (!response.ok) {
          throw new Error("Failed to fetch proposals");
        }
        const data = await response.json();
        setProposals(data.proposals || []);
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
      const response = await fetch("/api/student-union-approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposalId,
          approved,
          comments: comments[proposalId] || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit approval");
      }

      // Refresh proposals list
      const fetchResponse = await fetch("/api/student-union-proposals");
      const data = await fetchResponse.json();
      setProposals(data.proposals || []);

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
    <div className="min-h-svh bg-background">
      <StudentUnionHeader userEmail={data?.user?.email || ""} />

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        {proposals.length === 0 ? (
          <Card className="shadow-none rounded-none">
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium mb-4">
                No Proposals to Review
              </h3>
              <p className="text-muted-foreground">
                There are no proposals pending Student Union review at this
                time.
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
                        statusColors[
                          proposal.status as keyof typeof statusColors
                        ]
                      }`}
                    >
                      {
                        statusLabels[
                          proposal.status as keyof typeof statusLabels
                        ]
                      }
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
                        <div>
                          <strong>Description:</strong>{" "}
                          <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                            {proposal.event?.description ||
                              "No description provided"}
                          </div>
                        </div>
                        <p>
                          <strong>Time:</strong>{" "}
                          {proposal.event?.startTime && proposal.event?.endTime
                            ? `${new Date(
                                proposal.event.startTime
                              ).toLocaleString()} - ${new Date(
                                proposal.event.endTime
                              ).toLocaleString()}`
                            : "Not specified"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Lead Review Status
                      </h4>
                      <div className="space-y-2">
                        {proposal.leadApprovals.map((approval) => (
                          <div
                            key={approval.leadRole}
                            className="flex items-center gap-2"
                          >
                            <span className="text-sm font-medium">
                              {approval.leadRole}
                            </span>
                            <Badge
                              className={`${
                                approval.approved
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
                              }`}
                            >
                              {approval.approved ? "Approved" : "Pending"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {approval.leadEmail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {proposal.status === "PENDING" && (
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor={`comments-${proposal.id}`}
                          className="text-sm font-medium"
                        >
                          Comments (optional)
                        </label>
                        <textarea
                          id={`comments-${proposal.id}`}
                          className="w-full min-h-[80px] px-3 py-2 text-sm border border-border rounded-md"
                          placeholder="Add any comments about this approval..."
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
                          onClick={() => handleApproval(proposal.id, true)}
                          disabled={approving === proposal.id}
                          className="cursor-pointer"
                        >
                          {approving === proposal.id
                            ? "Approving..."
                            : "Approve"}
                        </Button>
                        <Button
                          onClick={() => handleApproval(proposal.id, false)}
                          disabled={approving === proposal.id}
                          variant="destructive"
                          className="cursor-pointer"
                        >
                          {approving === proposal.id
                            ? "Rejecting..."
                            : "Reject"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
