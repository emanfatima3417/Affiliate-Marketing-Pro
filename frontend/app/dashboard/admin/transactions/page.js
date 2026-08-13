"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/components/shared/dashboard-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, Loader2 } from "lucide-react";

const typeVariant = { sale: "accent", commission: "default", payout: "secondary", refund: "destructive" };

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState(null);

  useEffect(() => {
    api.get("/admin/transactions").then((data) => setTransactions(data.transactions)).catch(() => setTransactions([]));
  }, []);

  return (
    <DashboardShell navItems={adminNav} allowedRoles={["admin"]} title="All transactions">
      {!transactions ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : transactions.length === 0 ? (
        <EmptyState icon={Receipt} title="No transactions yet" />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Type</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{t.user?.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{t.user?.role}</p>
                  </td>
                  <td className="p-3"><Badge variant={typeVariant[t.type] || "secondary"} className="capitalize">{t.type}</Badge></td>
                  <td className="p-3 text-muted-foreground">{t.reference || t.order?.orderNumber || "—"}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(t.createdAt)}</td>
                  <td className="p-3"><Badge variant="outline" className="capitalize">{t.status}</Badge></td>
                  <td className="p-3 text-right font-semibold tabular-nums">{formatCurrency(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
