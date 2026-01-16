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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SkeletonProposalCard } from "@/components/skeleton-proposal-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDualTimeRange } from "@/lib/utils";
import { Trash } from "lucide-react";

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
    occurrences?: Array<{
      startTime: string;
      endTime: string;
      location: string;
    }>;
  };
  club: {
    name: string;
  };
  collaborators: Array<{
    name: string;
    type?: string;
  }>;
  guests: Array<{
    name: string;
    affiliation?: string | null;
    reason?: string | null;
  }>;
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
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [contributorsOpen, setContributorsOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [contributorsPage, setContributorsPage] = useState(1);
  const [guestsPage, setGuestsPage] = useState(1);

  const fetchProposals = async (nextPage: number) => {
    const response = await fetch(`/api/proposals?page=${nextPage}&limit=10`, {
      cache: "no-store",
    });
    if (!response.ok) {
      let message = "Failed to fetch proposals";
      try {
        const body = await response.json();
        if (body?.message) message = String(body.message);
      } catch {}
      throw new Error(message);
    }
    const resp = await response.json();
    setProposals(resp.proposals);
    setPagination(resp.pagination || null);
  };

  useEffect(() => {
    if (isPending) return;

    const run = async () => {
      try {
        await fetchProposals(page);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch proposals"
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [isPending, page]);

  const formatDaysLeft = (startTime?: string) => {
    if (!startTime) return "";
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) return "";
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 1) return `${diffDays} days left`;
    if (diffDays === 1) return "1 day left";
    if (diffDays === 0) return "Today";
    if (diffDays === -1) return "1 day ago";
    return `${Math.abs(diffDays)} days ago`;
  };

  const openDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setDetailsOpen(true);
    setContributorsOpen(false);
    setGuestsOpen(false);
    setContributorsPage(1);
    setGuestsPage(1);
  };

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
      await fetchProposals(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resubmit proposal");
    } finally {
      setResubmittingId(null);
    }
  };

  const handleArchive = async (proposalId: string) => {
    setArchivingId(proposalId);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/archive`, {
        method: "POST",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.message || "Failed to archive proposal");
      }
      setDetailsOpen(false);
      setSelectedProposal(null);
      await fetchProposals(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to archive proposal");
    } finally {
      setArchivingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="space-y-4">
          <Card className="shadow-none rounded-none">
            <CardHeader>
              <CardTitle className="text-xl">My Proposals</CardTitle>
            </CardHeader>
          </Card>
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonProposalCard key={index} />
          ))}
        </div>
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
    <div className="min-h-svh bg-background rounded-none">
      <main className="container mx-auto px-4 py-10 max-w-5xl rounded-none">
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
          <>
            <div className="space-y-2 rounded-none">
              {proposals.map((proposal) => {
                const { western, ethiopian } = formatDualTimeRange(
                  proposal.event?.startTime,
                  proposal.event?.endTime
                );
                const daysLeft = formatDaysLeft(proposal.event?.startTime);

                return (
                  <Card key={proposal.id} className="shadow-none rounded-none">
                    <CardContent className="p-0 rounded-none">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => openDetails(proposal)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetails(proposal);
                          }
                        }}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-none"
                      >
                        <div className="min-w-0 flex-1 rounded-none">
                          <div className="flex items-center justify-between gap-3 rounded-none">
                            <div className="min-w-0 rounded-none">
                              <div className="font-medium truncate rounded-none">
                                {proposal.event?.title || "Untitled Proposal"}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {daysLeft ? `${daysLeft} • ` : ""}
                                {ethiopian
                                  ? `Time: ${western} | LT: [${ethiopian}]`
                                  : `Time: ${western}`}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-none">
                              <Badge
                                className={`rounded-none ${
                                  statusColors[
                                    proposal.status as keyof typeof statusColors
                                  ]
                                } whitespace-nowrap`}
                              >
                                {
                                  statusLabels[
                                    proposal.status as keyof typeof statusLabels
                                  ]
                                }
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-2 rounded-none"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          {canEditProposal(proposal.status) && (
                            <Button
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/proposals/${proposal.id}/edit`);
                              }}
                              className="rounded-none h-8"
                            >
                              Edit
                            </Button>
                          )}
                          <AlertDialog  >
                            <AlertDialogTrigger asChild className="rounded-none">
                              <Button
                                variant="destructive"
                                disabled={
                                  archivingId === proposal.id ||
                                  resubmittingId === proposal.id
                                }
                                className="rounded-none h-8 w-8 p-0"
                                aria-label="Archive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-none sm:rounded-none">
                              <AlertDialogHeader className="rounded-none">
                                <AlertDialogTitle className="rounded-none" >
                                  Archive this proposal?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="rounded-none">
                                  It will be moved to the Archive page and will
                                  be deleted automatically after 2 days.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleArchive(proposal.id)}
                                >
                                  Archive
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          {canResubmitProposal(proposal.status) && (
                            <Button
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResubmit(proposal.id);
                              }}
                              disabled={resubmittingId === proposal.id}
                              className="rounded-none h-8"
                            >
                              {resubmittingId === proposal.id
                                ? "Resubmitting..."
                                : "Resubmit"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-6">
              <div className="text-sm text-muted-foreground">
                {pagination
                  ? `Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total)`
                  : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-none"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination || pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none"
                  onClick={() =>
                    setPage((p) =>
                      pagination
                        ? Math.min(pagination.totalPages, p + 1)
                        : p + 1
                    )
                  }
                  disabled={
                    !pagination || pagination.page >= pagination.totalPages
                  }
                >
                  Next
                </Button>
              </div>
            </div>

            <Dialog
              open={detailsOpen}
              onOpenChange={(open) => {
                setDetailsOpen(open);
                if (!open) {
                  setSelectedProposal(null);
                  setContributorsOpen(false);
                  setGuestsOpen(false);
                  setContributorsPage(1);
                  setGuestsPage(1);
                }
              }}
            >
              <DialogContent className="max-w-4xl">
                <DialogTitle className="sr-only">Proposal Details</DialogTitle>
                {selectedProposal ? (
                  <Card className="shadow-none rounded-none border-0">
                    <CardHeader className="px-0 pt-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {selectedProposal.event?.title ||
                              "Untitled Proposal"}
                          </CardTitle>
                          <CardDescription>
                            {selectedProposal.club.name} •{" "}
                            {new Date(
                              selectedProposal.createdAt
                            ).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge
                          className={`${
                            statusColors[
                              selectedProposal.status as keyof typeof statusColors
                            ]
                          }`}
                        >
                          {
                            statusLabels[
                              selectedProposal.status as keyof typeof statusLabels
                            ]
                          }
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 px-0 pb-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">
                            Event Details
                          </h4>
                          <div className="space-y-2">
                            <p>
                              <strong>Location:</strong>{" "}
                              {selectedProposal.event?.location ||
                                "Not specified"}
                            </p>
                            {Array.isArray(
                              selectedProposal.event?.occurrences
                            ) &&
                            selectedProposal.event.occurrences.length > 1 ? (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  <strong>Sessions:</strong>{" "}
                                  {selectedProposal.event.occurrences.length}
                                </p>
                                <div className="space-y-2">
                                  {selectedProposal.event.occurrences
                                    .slice()
                                    .sort(
                                      (a, b) =>
                                        new Date(a.startTime).getTime() -
                                        new Date(b.startTime).getTime()
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
                                          className="p-3 bg-muted/30 rounded-none"
                                        >
                                          <div className="text-sm">
                                            {western}
                                          </div>
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
                            <p className="text-sm text-muted-foreground">
                              <strong>Time:</strong>{" "}
                              {(() => {
                                const { western, ethiopian } =
                                  formatDualTimeRange(
                                    selectedProposal.event?.startTime,
                                    selectedProposal.event?.endTime
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
                            {selectedProposal.leadApprovals.map(
                              (approval, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-none"
                                >
                                  <div>
                                    <p className="font-medium">
                                      {approval.leadRole}
                                    </p>
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
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <h4 className="font-medium text-sm text-muted-foreground">
                              Contributors
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {selectedProposal.collaborators?.length || 0}
                              </span>
                              {(selectedProposal.collaborators?.length || 0) >
                              2 ? (
                                <Button
                                  variant="outline"
                                  className="rounded-none h-8"
                                  onClick={() => setContributorsOpen(true)}
                                >
                                  View all
                                </Button>
                              ) : null}
                            </div>
                          </div>
                          {selectedProposal.collaborators?.length ? (
                            <div className="space-y-2">
                              {selectedProposal.collaborators
                                .slice(0, 2)
                                .map((c, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-none"
                                  >
                                    <div className="min-w-0">
                                      <div className="font-medium truncate">
                                        {c.name}
                                      </div>
                                      {c.type ? (
                                        <div className="text-xs text-muted-foreground truncate">
                                          {c.type}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No contributors.
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <h4 className="font-medium text-sm text-muted-foreground">
                              Invited Guests
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {selectedProposal.guests?.length || 0}
                              </span>
                              {(selectedProposal.guests?.length || 0) > 2 ? (
                                <Button
                                  variant="outline"
                                  className="rounded-none h-8"
                                  onClick={() => setGuestsOpen(true)}
                                >
                                  View all
                                </Button>
                              ) : null}
                            </div>
                          </div>
                          {selectedProposal.guests?.length ? (
                            <div className="space-y-2">
                              {selectedProposal.guests
                                .slice(0, 2)
                                .map((g, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-muted/30 rounded-none"
                                  >
                                    <div className="font-medium truncate">
                                      {g.name}
                                    </div>
                                    {g.affiliation ? (
                                      <div className="text-xs text-muted-foreground truncate">
                                        {g.affiliation}
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No guests.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        {canEditProposal(selectedProposal.status) && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/proposals/${selectedProposal.id}/edit`
                              )
                            }
                            className="rounded-none"
                          >
                            Edit Proposal
                          </Button>
                        )}
                        {canResubmitProposal(selectedProposal.status) && (
                          <Button
                            variant="outline"
                            onClick={() => handleResubmit(selectedProposal.id)}
                            disabled={resubmittingId === selectedProposal.id}
                            className="rounded-none"
                          >
                            {resubmittingId === selectedProposal.id
                              ? "Resubmitting..."
                              : "Resubmit"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </DialogContent>
            </Dialog>

            <Dialog
              open={contributorsOpen}
              onOpenChange={(open) => {
                setContributorsOpen(open);
                if (!open) setContributorsPage(1);
              }}
            >
              <DialogContent className="max-w-2xl">
                <DialogTitle>Contributors</DialogTitle>
                {selectedProposal
                  ? (() => {
                      const items = selectedProposal.collaborators || [];
                      const limit = 10;
                      const totalPages = Math.max(
                        1,
                        Math.ceil(items.length / limit)
                      );
                      const pageSafe = Math.min(contributorsPage, totalPages);
                      const slice = items.slice(
                        (pageSafe - 1) * limit,
                        pageSafe * limit
                      );
                      return (
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            {items.length} total
                          </div>
                          <div className="space-y-2">
                            {slice.map((c, idx) => (
                              <div
                                key={`${pageSafe}-${idx}`}
                                className="flex items-center justify-between p-3 bg-muted/30 rounded-none"
                              >
                                <div className="min-w-0">
                                  <div className="font-medium truncate">
                                    {c.name}
                                  </div>
                                  {c.type ? (
                                    <div className="text-xs text-muted-foreground truncate">
                                      {c.type}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between gap-3 pt-2">
                            <div className="text-sm text-muted-foreground">
                              Page {pageSafe} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                className="rounded-none"
                                onClick={() =>
                                  setContributorsPage((p) => Math.max(1, p - 1))
                                }
                                disabled={pageSafe <= 1}
                              >
                                Previous
                              </Button>
                              <Button
                                variant="outline"
                                className="rounded-none"
                                onClick={() =>
                                  setContributorsPage((p) =>
                                    Math.min(totalPages, p + 1)
                                  )
                                }
                                disabled={pageSafe >= totalPages}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  : null}
              </DialogContent>
            </Dialog>

            <Dialog
              open={guestsOpen}
              onOpenChange={(open) => {
                setGuestsOpen(open);
                if (!open) setGuestsPage(1);
              }}
            >
              <DialogContent className="max-w-2xl">
                <DialogTitle>Invited Guests</DialogTitle>
                {selectedProposal
                  ? (() => {
                      const items = selectedProposal.guests || [];
                      const limit = 10;
                      const totalPages = Math.max(
                        1,
                        Math.ceil(items.length / limit)
                      );
                      const pageSafe = Math.min(guestsPage, totalPages);
                      const slice = items.slice(
                        (pageSafe - 1) * limit,
                        pageSafe * limit
                      );
                      return (
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            {items.length} total
                          </div>
                          <div className="space-y-2">
                            {slice.map((g, idx) => (
                              <div
                                key={`${pageSafe}-${idx}`}
                                className="p-3 bg-muted/30 rounded-none"
                              >
                                <div className="font-medium truncate">
                                  {g.name}
                                </div>
                                {g.affiliation ? (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {g.affiliation}
                                  </div>
                                ) : null}
                                {g.reason ? (
                                  <div className="text-xs text-muted-foreground">
                                    {g.reason}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between gap-3 pt-2">
                            <div className="text-sm text-muted-foreground">
                              Page {pageSafe} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                className="rounded-none"
                                onClick={() =>
                                  setGuestsPage((p) => Math.max(1, p - 1))
                                }
                                disabled={pageSafe <= 1}
                              >
                                Previous
                              </Button>
                              <Button
                                variant="outline"
                                className="rounded-none"
                                onClick={() =>
                                  setGuestsPage((p) =>
                                    Math.min(totalPages, p + 1)
                                  )
                                }
                                disabled={pageSafe >= totalPages}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  : null}
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>
    </div>
  );
}
