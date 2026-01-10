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
    reviewerRole: "STUDENT_UNION" | "DIRECTOR";
    reviewerEmail: string;
    recommendation: string | null;
    comments: string | null;
    updatedAt: string;
  }>;
}

const statusColors = {
  DIRECTOR_APPROVED: "bg-purple-100 text-purple-800 border-purple-300",
} as const;

export default function DirectorApprovedPage() {
  const { data, isPending } = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;

    const fetchProposals = async () => {
      try {
        const response = await fetch("/api/director-approved-proposals");
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
              There are no proposals approved by the Director yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {proposals.map((proposal) => {
            const directorReview = proposal.reviews?.find(
              (r) => r.reviewerRole === "DIRECTOR"
            );
            const suReview = proposal.reviews?.find(
              (r) => r.reviewerRole === "STUDENT_UNION"
            );

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
                        Decisions
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="font-medium">Student Union</p>
                          <p className="text-muted-foreground">
                            {suReview?.recommendation || "Recommended"}
                          </p>
                          {suReview?.comments ? (
                            <p className="text-muted-foreground">
                              {suReview.comments}
                            </p>
                          ) : null}
                        </div>

                        <div className="pt-2 border-t border-border">
                          <p className="font-medium">Director</p>
                          <p className="text-muted-foreground">
                            {directorReview?.recommendation || "Recommended"}
                          </p>
                          {directorReview?.comments ? (
                            <p className="text-muted-foreground">
                              {directorReview.comments}
                            </p>
                          ) : null}
                        </div>
                      </div>
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
