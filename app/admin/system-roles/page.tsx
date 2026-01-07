"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type SystemRole = "ADMIN" | "DIRECTOR" | "STUDENT_UNION";

type SystemRoleGrant = { id: string; email: string; role: SystemRole };

const selectClassName =
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export default function AdminSystemRolesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [systemRoleGrants, setSystemRoleGrants] = useState<SystemRoleGrant[]>(
    []
  );

  const [systemRole, setSystemRole] = useState<SystemRole>("DIRECTOR");
  const [systemRoleEmail, setSystemRoleEmail] = useState("");

  const refresh = async () => {
    const rolesRes = await fetch("/api/admin/system-role-grants", {
      cache: "no-store",
    });
    if (!rolesRes.ok) throw new Error("Failed to load system roles");
    const rolesJson = await rolesRes.json();
    setSystemRoleGrants(rolesJson.grants || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refresh();
      } catch (e: any) {
        setError(e?.message || "Failed to load system roles");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grant = async () => {
    setMessage(null);
    setError(null);

    const email = systemRoleEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Enter a valid email");
      return;
    }

    const res = await fetch("/api/admin/system-role-grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: systemRole }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message || "Failed to grant system role");
      return;
    }

    setSystemRoleEmail("");
    setMessage("System role granted.");
    await refresh();
  };

  return (
    <div className="grid gap-6">
      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!loading && error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && message && (
        <p className="text-sm text-emerald-700">{message}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Grant System Roles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="systemRole">Role</Label>
              <select
                id="systemRole"
                className={selectClassName}
                value={systemRole}
                onChange={(e) => setSystemRole(e.target.value as SystemRole)}
              >
                <option value="DIRECTOR">Director</option>
                <option value="STUDENT_UNION">Student Union</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="systemRoleEmail">User Email</Label>
              <Input
                id="systemRoleEmail"
                type="email"
                value={systemRoleEmail}
                onChange={(e) => setSystemRoleEmail(e.target.value)}
                placeholder="user@school.edu"
              />
            </div>
          </div>

          <Button onClick={grant}>Grant</Button>

          <div className="grid gap-1 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Existing grants</div>
            {systemRoleGrants.length === 0 && <div>No system roles yet.</div>}
            {systemRoleGrants.map((g) => (
              <div key={g.id}>
                {g.role}: {g.email}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
