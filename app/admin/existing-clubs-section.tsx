"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirmation } from "@/components/ui/confirmation-card";

type ClubRole = "PRESIDENT" | "VP" | "SECRETARY";

type Club = {
  id: string;
  name: string;
  roleGrants: Array<{
    id: string;
    clubId: string;
    email: string;
    role: ClubRole;
  }>;
};

function getClubLeadEmail(club: Club, role: ClubRole) {
  const grant = (club.roleGrants || []).find((g) => g.role === role);
  return grant?.email || "—";
}

export function ExistingClubsSection({
  clubs,
  onEdit,
  onDelete,
}: {
  clubs: Club[];
  onEdit: (club: Club) => void;
  onDelete: (clubId: string) => void;
}) {
  const { requestConfirmation, ConfirmationComponent } = useConfirmation();
  return (
    <>
      <ConfirmationComponent />
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-gray-900"> ADDIS ABABA UNIVERSITY CLUBS</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {clubs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clubs yet.</p>
          ) : (
            <div className="grid gap-3">
              {clubs.map((c) => (
                <div key={c.id} className="border border-border p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-medium">{c.name.toUpperCase()}</div>
                    <div className="flex gap-2">
                      <Button
                        className="rounded-none"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        className="rounded-none"
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          const confirmed = await requestConfirmation(
                            "Delete Club",
                            `Are you sure you want to delete ${c.name.toUpperCase()}? This action cannot be undone and will also remove all associated club role grants.`,
                            () => {},
                            {
                              variant: "destructive",
                              confirmText: "Delete",
                              cancelText: "Cancel",
                            }
                          );
                          if (confirmed) {
                            onDelete(c.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                    <div>President: {getClubLeadEmail(c, "PRESIDENT")}</div>
                    <div>VP: {getClubLeadEmail(c, "VP")}</div>
                    <div>Secretary: {getClubLeadEmail(c, "SECRETARY")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
