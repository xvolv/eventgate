"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AdminAddClubPage() {
  const [clubName, setClubName] = useState("");
  const [presidentEmail, setPresidentEmail] = useState("");
  const [vpEmail, setVpEmail] = useState("");
  const [secretaryEmail, setSecretaryEmail] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clear = () => {
    setClubName("");
    setPresidentEmail("");
    setVpEmail("");
    setSecretaryEmail("");
  };

  const save = async () => {
    setMessage(null);
    setError(null);

    const name = clubName.trim();
    if (!name) {
      setError("Club name is required");
      return;
    }

    const normalizedPresident = presidentEmail.trim().toLowerCase();
    const normalizedVp = vpEmail.trim().toLowerCase();
    const normalizedSecretary = secretaryEmail.trim().toLowerCase();

    if (normalizedPresident && !normalizedPresident.includes("@")) {
      setError("President email is invalid");
      return;
    }
    if (normalizedVp && !normalizedVp.includes("@")) {
      setError("VP email is invalid");
      return;
    }
    if (normalizedSecretary && !normalizedSecretary.includes("@")) {
      setError("Secretary email is invalid");
      return;
    }

    const res = await fetch("/api/admin/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        presidentEmail: normalizedPresident,
        vpEmail: normalizedVp,
        secretaryEmail: normalizedSecretary,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message || "Failed to save club");
      return;
    }

    setMessage("Club created.");
    clear();
  };

  return (
    <div className="grid gap-6">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Add Club</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="clubName">Club Name</Label>
            <Input
              id="clubName"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="e.g., Computer Science Society"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

          <div className="flex flex-wrap gap-2">
            <Button onClick={save}>Create</Button>
            <Button variant="outline" onClick={clear}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
