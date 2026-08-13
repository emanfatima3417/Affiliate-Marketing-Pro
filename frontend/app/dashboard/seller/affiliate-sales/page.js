"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { sellerNav } from "@/components/shared/dashboard-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Link2, Loader2 } from "lucide-react";

export default function SellerAffiliateSalesPage() {
  const [commissions, setCommissions] = useState(null);

  useEffect(() => {
    api.get("/sellers/affiliate-sales").then((data) => setCommissions(data.commissions)).catch(() => setCommissions([]));
  }, []);

  const totalPaid = (commissions || []).reduce((sum, c) => sum + c.amount, 0);

  return (
    <DashboardShell navItems={sellerNav} allowedRoles={["seller", "admin"]} title="Affiliate-driven sales">
      {!commissions ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : commissions.length === 0 ? (
        <EmptyState icon={Link2} title="No affiliate sales yet" description="When an affiliate drives a sale on one of your products, it'll appear here." />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Total commission paid out to affiliates: <span className="font-semibold text-foreground tabular-nums">{formatCurrency(totalPaid)}</span>
          </p>
          <div className="space-y-2">
            {commissions.map((c) => (
              <div key={c._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-3 text-sm">
                <div>
                  <p className="font-semibold">{c.product?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    via {c.affiliate?.user?.name || "affiliate"} · {formatDate(c.createdAt)}
                  </p>
                </div>
                <Badge variant="secondary">{c.percent}%</Badge>
                <p className="font-semibold tabular-nums text-accent">-{formatCurrency(c.amount)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
