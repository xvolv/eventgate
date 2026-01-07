"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ExistingClubsSection } from "../existing-clubs-section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState("");
  const [presidentEmail, setPresidentEmail] = useState("");
  const [vpEmail, setVpEmail] = useState("");
  const [secretaryEmail, setSecretaryEmail] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const refresh = async () => {
    const clubsRes = await fetch("/api/admin/clubs", { cache: "no-store" });
    if (!clubsRes.ok) throw new Error("Failed to load clubs");
    const clubsJson = await clubsRes.json();
    setClubs(clubsJson.clubs || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refresh();
      } catch (e: any) {
        setError(e?.message || "Failed to load clubs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditingClubId(null);
    setClubName("");
    setPresidentEmail("");
    setVpEmail("");
    setSecretaryEmail("");
    setEditError(null);
  };

  const startEdit = (club: Club) => {
    setMessage(null);
    setError(null);
    setEditError(null);
    setEditingClubId(club.id);
    setClubName(club.name);
    setPresidentEmail(
      (club.roleGrants || []).find((g) => g.role === "PRESIDENT")?.email || ""
    );
    setVpEmail((club.roleGrants || []).find((g) => g.role === "VP")?.email || "");
    setSecretaryEmail(
      (club.roleGrants || []).find((g) => g.role === "SECRETARY")?.email || ""
    );
    setIsEditOpen(true);
  };

  const save = async () => {
    setMessage(null);
    setError(null);
    setEditError(null);

    if (!editingClubId) {
      setEditError("Select a club to edit.");
      return;
    }

    const name = clubName.trim();
    if (!name) {
      setEditError("Club name is required");
      return;
    }

    const normalizedPresident = presidentEmail.trim().toLowerCase();
    const normalizedVp = vpEmail.trim().toLowerCase();
    const normalizedSecretary = secretaryEmail.trim().toLowerCase();

    if (normalizedPresident && !normalizedPresident.includes("@")) {
      setEditError("President email is invalid");
      return;
    }
    if (normalizedVp && !normalizedVp.includes("@")) {
      setEditError("VP email is invalid");
      return;
    }
    if (normalizedSecretary && !normalizedSecretary.includes("@")) {
      setEditError("Secretary email is invalid");
      return;
    }

    const res = await fetch("/api/admin/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clubId: editingClubId,
        name,
        presidentEmail: normalizedPresident,
        vpEmail: normalizedVp,
        secretaryEmail: normalizedSecretary,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setEditError(body?.message || "Failed to save club");
      return;
    }

    setMessage("Club updated.");
    closeEdit();
    await refresh();
  };

  return (
    <div className="grid gap-6">
      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!loading && error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && message && (
        <p className="text-sm text-emerald-700">{message}</p>
      )}

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>
              Update the club name and lead emails, then confirm.
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <p className="text-sm text-destructive">{editError}</p>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="clubName">Club Name</Label>
              <Input
                id="clubName"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="e.g., Computer Science Society"
              />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="presidentEmail">President Email (optional)</Label>
                <Input
                  id="presidentEmail"
                  type="email"
                  value={presidentEmail}
                  onChange={(e) => setPresidentEmail(e.target.value)}
                  placeholder="president@club.edu"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="vpEmail">VP Email (optional)</Label>
                <Input
                  id="vpEmail"
                  type="email"
                  value={vpEmail}
                  onChange={(e) => setVpEmail(e.target.value)}
                  placeholder="vp@club.edu"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="secretaryEmail">Secretary Email (optional)</Label>
                <Input
                  id="secretaryEmail"
                  type="email"
                  value={secretaryEmail}
                  onChange={(e) => setSecretaryEmail(e.target.value)}
                  placeholder="secretary@club.edu"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              Cancel
            </Button>
            <Button onClick={save}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExistingClubsSection clubs={clubs} onEdit={startEdit} />
    </div>
  );
}
