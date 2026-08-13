"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/components/shared/dashboard-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/api";
import { formatDate, initials } from "@/lib/utils";
import { toast } from "@/components/ui/toast-store";
import { Loader2 } from "lucide-react";

const ROLE_FILTERS = ["all", "seller", "affiliate", "customer", "admin"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () => {
    const query = filter !== "all" ? `?role=${filter}` : "";
    api.get(`/admin/users${query}`).then((data) => setUsers(data.users)).catch(() => setUsers([]));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const setSellerStatus = async (id, status) => {
    try {
      await api.put(`/admin/users/${id}/seller-status`, { status });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status } : u)));
      toast({ title: "Seller updated", description: `Status set to ${status}` });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.put(`/admin/users/${id}/active`, { isActive });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive } : u)));
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <DashboardShell navItems={adminNav} allowedRoles={["admin"]} title="Users">
      <Tabs value={filter} onValueChange={setFilter} className="mb-5">
        <TabsList>
          {ROLE_FILTERS.map((r) => (
            <TabsTrigger key={r} value={r} className="capitalize">{r}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {!users ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u._id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {initials(u.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email} · joined {formatDate(u.createdAt)}</p>
              </div>
              <Badge variant="secondary" className="capitalize">{u.role}</Badge>

              {u.role === "seller" && (
                <Badge
                  variant={u.status === "approved" ? "accent" : u.status === "pending" ? "secondary" : "destructive"}
                  className="capitalize"
                >
                  {u.status}
                </Badge>
              )}

              {u.role === "seller" && u.status === "pending" && (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="accent" onClick={() => setSellerStatus(u._id, "approved")}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => setSellerStatus(u._id, "rejected")}>Reject</Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Active</span>
                <Switch checked={u.isActive} onCheckedChange={(v) => toggleActive(u._id, v)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
