"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/components/shared/dashboard-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "@/components/ui/toast-store";
import { TrendingUp, Loader2, Banknote } from "lucide-react";

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState(null);
  const [payingOut, setPayingOut] = useState(null);

  const load = () => {
    api.get("/admin/affiliates").then((data) => setAffiliates(data.affiliates)).catch(() => setAffiliates([]));
  };

  useEffect(() => { load(); }, []);

  const handlePayout = async (affiliate) => {
    const name = affiliate.user?.name || "this affiliate";
    if (!confirm(`Mark ${formatCurrency(affiliate.balance)} as paid out to ${name}? This records the payout in the ledger - it doesn't send money on its own, so make sure you've actually transferred it first.`)) {
      return;
    }
    setPayingOut(affiliate._id);
    try {
      await api.post(`/admin/affiliates/${affiliate._id}/payout`);
      toast({ title: "Payout recorded", description: `${formatCurrency(affiliate.balance)} marked as paid to ${name}` });
      load();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPayingOut(null);
    }
  };

  return (
    <DashboardShell navItems={adminNav} allowedRoles={["admin"]} title="Affiliate performance">
      {!affiliates ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : affiliates.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No affiliates yet" />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Affiliate</th>
                <th className="p-3">Code</th>
                <th className="p-3">Clicks</th>
                <th className="p-3">Conversions</th>
                <th className="p-3">Conv. rate</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Total earned</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => (
                <tr key={a._id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{a.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{a.user?.email}</p>
                  </td>
                  <td className="p-3"><Badge variant="secondary">{a.code}</Badge></td>
                  <td className="p-3 tabular-nums">{formatNumber(a.totalClicks)}</td>
                  <td className="p-3 tabular-nums">{formatNumber(a.totalConversions)}</td>
                  <td className="p-3 tabular-nums">{a.conversionRate || 0}%</td>
                  <td className="p-3 font-semibold tabular-nums text-accent">{formatCurrency(a.balance)}</td>
                  <td className="p-3 tabular-nums">{formatCurrency(a.totalEarnings)}</td>
                  <td className="p-3">
                    {a.balance > 0 && (
                      <Button
                        size="sm"
                        variant="accent"
                        className="gap-1.5"
                        disabled={payingOut === a._id}
                        onClick={() => handlePayout(a)}
                      >
                        {payingOut === a._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Banknote className="h-3.5 w-3.5" />}
                        Pay out
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
