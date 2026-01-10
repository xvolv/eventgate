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
} as const;

export default function StudentUnionApprovedPage() {
  const { data, isPending } = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;

    const fetchProposals = async () => {
      try {
        const response = await fetch("/api/student-union-approved-proposals");
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

    fetchProposals();
  }, [isPending]);

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
            <h3 className="text-lg font-medium mb-4">No Approved Proposals</h3>
            <p className="text-muted-foreground">
              There are no proposals approved by Student Union yet.
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
                        ]
                      }`}
                    >
                      Approved
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

                  <div className="border-t border-border pt-4">
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
