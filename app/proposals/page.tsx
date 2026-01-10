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
import { formatDualTimeRange } from "@/lib/utils";

interface Proposal {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  event: {
    title: string;
    startTime: string;
    endTime: string;
    location: string;
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

export default function ProposalsPage() {
  const { data, isPending } = useSession();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;

    const fetchProposals = async () => {
      try {
        const response = await fetch("/api/proposals");
        if (!response.ok) {
          throw new Error("Failed to fetch proposals");
        }
        const data = await response.json();
        setProposals(data.proposals);
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

  const canEditProposal = (status: string) => {
    return (
      status === "LEAD_REVIEW" ||
      status === "LEAD_APPROVED" ||
      status === "LEAD_REJECTED" ||
      status === "SU_REJECTED" ||
      status === "DIRECTOR_REJECTED" ||
      status === "RESUBMISSION_REQUIRED"
    );
  };

  const canResubmitProposal = (status: string) => {
    return (
      status === "LEAD_REJECTED" ||
      status === "SU_REJECTED" ||
      status === "DIRECTOR_REJECTED" ||
      status === "RESUBMISSION_REQUIRED"
    );
  };

  const handleResubmit = async (proposalId: string) => {
    setResubmittingId(proposalId);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/resubmit`, {
        method: "POST",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || "Failed to resubmit proposal");
      }
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resubmit proposal");
    } finally {
      setResubmittingId(null);
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
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        {proposals.length === 0 ? (
          <Card className="shadow-none rounded-none">
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium mb-4">No Proposals Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't submitted any event proposals yet.
              </p>
              <Button
                onClick={() => router.push("/president/new")}
                className="rounded-none"
              >
                Create Your First Proposal
              </Button>
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
                        <p className="text-sm text-muted-foreground">
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

                  <div className="flex gap-3 pt-4">
                    {canEditProposal(proposal.status) && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push(`/proposals/${proposal.id}/edit`)
                        }
                        className="rounded-none"
                      >
                        Edit Proposal
                      </Button>
                    )}
                    {canResubmitProposal(proposal.status) && (
                      <Button
                        variant="outline"
                        onClick={() => handleResubmit(proposal.id)}
                        disabled={resubmittingId === proposal.id}
                        className="rounded-none"
                      >
                        {resubmittingId === proposal.id
                          ? "Resubmitting..."
                          : "Resubmit"}
                      </Button>
                    )}
                    {proposal.status === "LEAD_REVIEW" && (
                      <Button
                        onClick={() =>
                          router.push(`/proposals/${proposal.id}/review`)
                        }
                        className="rounded-none"
                      >
                        Review Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
