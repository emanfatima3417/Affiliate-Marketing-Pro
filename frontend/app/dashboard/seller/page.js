"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { sellerNav } from "@/components/shared/dashboard-nav";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DollarSign, Package, ShoppingBag, Link2, Loader2, AlertTriangle, Plus } from "lucide-react";

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/sellers/dashboard").then(setData).catch(() => setData(false));
  }, []);

  const pending = user?.status === "pending";

  return (
    <DashboardShell navItems={sellerNav} allowedRoles={["seller", "admin"]} title="Seller overview">
      {pending && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-300/50 bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Your seller account is pending admin approval. You can't list products until it's approved.
        </div>
      )}

      {!data ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total revenue" value={formatCurrency(data.stats.totalRevenue)} icon={DollarSign} accent />
            <StatCard label="Net earnings" value={formatCurrency(data.stats.netEarnings)} icon={DollarSign} />
            <StatCard label="Products" value={`${data.stats.activeProductCount}/${data.stats.productCount}`} icon={Package} trend="Active / Total" />
            <StatCard label="Orders" value={formatNumber(data.stats.orderCount)} icon={ShoppingBag} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StatCard label="Units sold" value={formatNumber(data.stats.totalUnitsSold)} icon={Package} />
            <StatCard
              label="Affiliate-driven revenue"
              value={formatCurrency(data.stats.affiliateDrivenRevenue)}
              icon={Link2}
              trend={`${formatNumber(data.stats.affiliateDrivenUnits)} units via affiliates`}
              accent
            />
          </div>

          <div className="mt-8 rounded-lg border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-bold">Top products</h2>
              <Link href="/dashboard/seller/products/new"><Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New product</Button></Link>
            </div>
            {data.topProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No products yet.</p>
            ) : (
              <div className="space-y-2">
                {data.topProducts.map((p) => (
                  <div key={p._id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span className="font-semibold">{p.title}</span>
                    <span className="text-muted-foreground">{p.stock} in stock</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(p.totalRevenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
