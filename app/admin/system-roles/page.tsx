"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useConfirmation } from "@/components/ui/confirmation-card";

type SystemRole = "ADMIN" | "DIRECTOR" | "STUDENT_UNION";

type SystemRoleGrant = { id: string; email: string; role: SystemRole };

type RolesCacheEntry = {
  grants: SystemRoleGrant[];
  total: number;
  page: number;
  timestamp: number;
};

const ROLES_CACHE_TTL_MS = 60_000;
const rolesCache = new Map<string, RolesCacheEntry>();

const cacheKey = (page: number, query: string) =>
  `${page}::${query.trim().toLowerCase()}`;

const getFreshCache = (page: number, query: string) => {
  const key = cacheKey(page, query);
  const entry = rolesCache.get(key);
  if (!entry) return null;
  return Date.now() - entry.timestamp < ROLES_CACHE_TTL_MS ? entry : null;
};

const setRolesCache = (
  page: number,
  query: string,
  data: Omit<RolesCacheEntry, "timestamp">
) => {
  rolesCache.set(cacheKey(page, query), {
    ...data,
    timestamp: Date.now(),
  });
};

const clearRolesCache = () => rolesCache.clear();

const selectClassName =
  "file:text-foreground  placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-none border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export default function AdminSystemRolesPage() {
  const [loading, setLoading] = useState(!Boolean(getFreshCache(1, "")));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  const { requestConfirmation, ConfirmationComponent } = useConfirmation();

  const [systemRoleGrants, setSystemRoleGrants] = useState<SystemRoleGrant[]>(
    []
  );

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isAbortError = (e: unknown) => {
    if (!e) return false;
    if (
      typeof e === "object" &&
      "name" in e &&
      (e as any).name === "AbortError"
    ) {
      return true;
    }
    const msg =
      typeof e === "object" && e && "message" in e
        ? String((e as any).message)
        : "";
    return msg.toLowerCase().includes("abort");
  };

  const [systemRole, setSystemRole] = useState<SystemRole>("DIRECTOR");
  const [systemRoleEmail, setSystemRoleEmail] = useState("");
  const [editingGrantId, setEditingGrantId] = useState<string | null>(null);
  const [editingGrantEmail, setEditingGrantEmail] = useState("");
  const [editingOriginal, setEditingOriginal] = useState<{
    email: string;
    role: SystemRole;
  } | null>(null);
  const [editingGrantRole, setEditingGrantRole] =
    useState<SystemRole>("DIRECTOR");

  const refresh = async (
    pageOverride?: number,
    queryOverride?: string,
    opts?: { force?: boolean }
  ) => {
    const pageToUse = pageOverride ?? page;
    const queryToUse = (queryOverride ?? query).trim();

    const cached = !opts?.force && getFreshCache(pageToUse, queryToUse);
    if (cached) {
      setSystemRoleGrants(cached.grants);
      setTotal(cached.total);
      setPage(cached.page);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const rolesRes = await fetch(
        `/api/admin/system-role-grants?page=${pageToUse}&q=${encodeURIComponent(
          queryToUse
        )}`,
        {
          signal: controller.signal,
        }
      );
      if (!rolesRes.ok) throw new Error("Failed to load system roles");
      const rolesJson = await rolesRes.json();
      const nextGrants = rolesJson.grants || [];
      const nextTotal = rolesJson.total || 0;
      const nextPage = rolesJson.page || pageToUse;

      setSystemRoleGrants(nextGrants);
      setTotal(nextTotal);
      setPage(nextPage);

      setRolesCache(pageToUse, queryToUse, {
        grants: nextGrants,
        total: nextTotal,
        page: nextPage,
      });
    } catch (e) {
      if (isAbortError(e)) return;
      throw e;
    }
  };

  const deleteGrant = async (grant: SystemRoleGrant) => {
    const confirmed = await requestConfirmation(
      "Delete System Role Grant",
      `Delete system role grant for ${grant.email} (${grant.role})?`,
      () => {},
      { variant: "destructive", confirmText: "Delete", cancelText: "Cancel" }
    );
    if (!confirmed) return;

    setMessage(null);
    setError(null);
    setIsRefetching(true);
    try {
      const res = await fetch("/api/admin/system-role-grants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: grant.id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || "Failed to delete system role grant");
        return;
      }

      setMessage("System role grant deleted.");

      const nextPage =
        systemRoleGrants.length === 1 ? Math.max(1, page - 1) : page;
      clearRolesCache();
      await refresh(nextPage, query, { force: true });
    } finally {
      setIsRefetching(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const cached = getFreshCache(1, "");
        if (cached) {
          setSystemRoleGrants(cached.grants);
          setTotal(cached.total);
          setPage(cached.page);
        }

        await refresh(1, "", { force: !cached });
        setInitialLoaded(true);
      } catch (e: any) {
        if (!isAbortError(e)) {
          setError(e?.message || "Failed to load system roles");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!initialLoaded) return;

    const handle = setTimeout(async () => {
      setIsRefetching(true);
      setMessage(null);
      setError(null);
      try {
        await refresh(1, query);
      } catch (e: any) {
        if (!isAbortError(e)) {
          setError(e?.message || "Failed to load system roles");
        }
      } finally {
        setIsRefetching(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query, initialLoaded]);

  useEffect(() => {
    if (!message && !error) return;
    setToastOpen(true);
    const handle = setTimeout(() => setToastOpen(false), 4000);
    return () => clearTimeout(handle);
  }, [message, error]);

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
    clearRolesCache();
    await refresh(1, query, { force: true });
  };

  const handleSearch = async () => {
    setMessage(null);
    setError(null);
    await refresh(1, query);
  };

  const goToPage = async (nextPage: number) => {
    setMessage(null);
    setError(null);
    setIsRefetching(true);
    try {
      await refresh(nextPage);
    } finally {
      setIsRefetching(false);
    }
  };

  const startEditGrant = (grant: SystemRoleGrant) => {
    setMessage(null);
    setError(null);
    setEditingGrantId(grant.id);
    setEditingGrantEmail(grant.email);
    setEditingGrantRole(grant.role);
    setEditingOriginal({ email: grant.email, role: grant.role });
  };

  const cancelEditGrant = () => {
    setEditingGrantId(null);
    setEditingGrantEmail("");
    setEditingGrantRole("DIRECTOR");
    setEditingOriginal(null);
  };

  const saveGrant = async () => {
    if (!editingGrantId) return;
    setMessage(null);
    setError(null);

    const email = editingGrantEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Enter a valid email");
      return;
    }

    const originalEmail = (editingOriginal?.email || "").trim().toLowerCase();
    const originalRole = editingOriginal?.role;
    const roleUnchanged = originalRole
      ? originalRole === editingGrantRole
      : false;
    const emailUnchanged = originalEmail ? originalEmail === email : false;

    if (roleUnchanged && emailUnchanged) {
      setMessage("No changes to save.");
      cancelEditGrant();
      return;
    }

    const res = await fetch("/api/admin/system-role-grants", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingGrantId,
        email,
        role: editingGrantRole,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message || "Failed to update system role");
      return;
    }

    setMessage("System role updated.");
    cancelEditGrant();
    setIsRefetching(true);
    try {
      clearRolesCache();
      await refresh(page, query, { force: true });
    } finally {
      setIsRefetching(false);
    }
  };

  return (
    <div className="grid gap-6">
      <ConfirmationComponent />
      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      <Card>
        <CardHeader>
          <CardTitle>Grant System Roles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end">
            <div className="grid gap-2 md:flex-1">
              <Label htmlFor="filter">Filter (email or role)</Label>
              <Input
                id="filter"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="admin or user@school.edu"
              />
            </div>
            <Button className="md:self-end" onClick={handleSearch}>
              Apply Filter
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="systemRole">Role</Label>
              <select
                id="systemRole"
                className={`${selectClassName}`}
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

          <div
            className={`grid gap-1 text-sm text-muted-foreground ${
              isRefetching ? "opacity-60 transition-opacity" : ""
            }`}
          >
            <div className="font-medium text-foreground">Existing grants</div>
            {systemRoleGrants.length === 0 && <div>No system roles yet.</div>}
            {systemRoleGrants.map((g) => (
              <div
                key={g.id}
                className="flex flex-col gap-2 border border-border/50 p-3 md:flex-row md:items-center md:gap-3"
              >
                {editingGrantId === g.id ? (
                  <>
                    <select
                      className={selectClassName}
                      value={editingGrantRole}
                      onChange={(e) =>
                        setEditingGrantRole(e.target.value as SystemRole)
                      }
                    >
                      <option value="DIRECTOR">Director</option>
                      <option value="STUDENT_UNION">Student Union</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <Input
                      type="email"
                      value={editingGrantEmail}
                      onChange={(e) => setEditingGrantEmail(e.target.value)}
                      placeholder="user@school.edu"
                    />
                    <div className="flex gap-2">
                      <Button onClick={saveGrant}>Save</Button>
                      <Button variant="outline" onClick={cancelEditGrant}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {g.role}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {g.email}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => startEditGrant(g)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => deleteGrant(g)}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-2 border-t border-border/60">
              <div className="text-xs text-muted-foreground">
                Showing{" "}
                {systemRoleGrants.length ? (page - 1) * pageSize + 1 : 0}-
                {(page - 1) * pageSize + systemRoleGrants.length} of {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  onClick={() => goToPage(page + 1)}
                  disabled={
                    (page - 1) * pageSize + systemRoleGrants.length >= total
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(message || error) && toastOpen && (
        <div
          className="fixed bottom-4 right-4 z-50 w-88 max-w-[calc(100vw-2rem)]"
          role="status"
          aria-live={error ? "assertive" : "polite"}
        >
          <div
            className={
              error
                ? "border border-destructive/30 bg-background"
                : "border border-border bg-background"
            }
          >
            <div className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div
                  className={
                    error
                      ? "text-sm font-medium text-destructive"
                      : "text-sm font-medium text-foreground"
                  }
                >
                  {error ? "Action failed" : "Update"}
                </div>
                <div
                  className={
                    error
                      ? "mt-1 text-sm text-destructive/90"
                      : "mt-1 text-sm text-muted-foreground"
                  }
                >
                  {error || message}
                </div>
              </div>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label="Dismiss"
                onClick={() => setToastOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
