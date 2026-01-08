"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
}: {
  clubs: Club[];
  onEdit: (club: Club) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Existing Clubs</CardTitle>
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
                  <Button className="rounded-none" variant="outline" size="sm" onClick={() => onEdit(c)}>
                    Edit
                  </Button>
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
  );
}
