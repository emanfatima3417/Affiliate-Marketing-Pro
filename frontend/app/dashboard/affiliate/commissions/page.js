"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { affiliateNav } from "@/components/shared/dashboard-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, Loader2 } from "lucide-react";

const statusVariant = { pending: "secondary", approved: "default", paid: "accent", cancelled: "destructive" };

export default function AffiliateCommissionsPage() {
  const [commissions, setCommissions] = useState(null);

  useEffect(() => {
    api.get("/affiliates/commissions").then((data) => setCommissions(data.commissions)).catch(() => setCommissions([]));
  }, []);

  const totalPending = (commissions || []).filter((c) => c.status !== "paid").reduce((s, c) => s + c.amount, 0);
  const totalPaid = (commissions || []).filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);

  return (
    <DashboardShell navItems={affiliateNav} allowedRoles={["affiliate", "admin"]} title="Commissions & payouts">
      {!commissions ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : commissions.length === 0 ? (
        <EmptyState icon={Wallet} title="No commissions yet" description="Share your affiliate links to start earning commissions on sales." />
      ) : (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Pending / approved</p>
              <p className="mt-1 font-display text-xl font-extrabold tabular-nums">{formatCurrency(totalPending)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Paid out</p>
              <p className="mt-1 font-display text-xl font-extrabold tabular-nums text-accent">{formatCurrency(totalPaid)}</p>
            </div>
          </div>

          <div className="space-y-2">
            {commissions.map((c) => (
              <div key={c._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-3 text-sm">
                <div>
                  <p className="font-semibold">{c.product?.title}</p>
                  <p className="text-xs text-muted-foreground">Order {c.order?.orderNumber} · {formatDate(c.createdAt)}</p>
                </div>
                <Badge variant={statusVariant[c.status] || "secondary"} className="capitalize">{c.status}</Badge>
                <p className="font-semibold tabular-nums text-accent">+{formatCurrency(c.amount)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
