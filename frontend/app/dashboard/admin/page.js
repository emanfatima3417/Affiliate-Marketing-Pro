"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/components/shared/dashboard-nav";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SimpleLineChart, SimpleBarChart } from "@/components/shared/charts";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DollarSign, Users, Package, ShoppingBag, Percent, Store, Loader2, AlertTriangle } from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard").then(setData).catch(() => setData(false));
  }, []);

  return (
    <DashboardShell navItems={adminNav} allowedRoles={["admin"]} title="Admin overview">
      {!data ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total revenue" value={formatCurrency(data.stats.totalRevenue)} icon={DollarSign} accent />
            <StatCard label="Total commissions" value={formatCurrency(data.stats.totalCommissions)} icon={Percent} />
            <StatCard label="Orders" value={formatNumber(data.stats.totalOrders)} icon={ShoppingBag} />
            <StatCard label="Products" value={formatNumber(data.stats.totalProducts)} icon={Package} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total users" value={formatNumber(data.stats.totalUsers)} icon={Users} />
            <StatCard label="Sellers" value={formatNumber(data.stats.totalSellers)} icon={Store} />
            <StatCard label="Affiliates" value={formatNumber(data.stats.totalAffiliates)} icon={Users} />
            <StatCard label="Customers" value={formatNumber(data.stats.totalCustomers)} icon={Users} />
          </div>

          {data.stats.pendingSellers > 0 && (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-yellow-300/50 bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {data.stats.pendingSellers} seller account{data.stats.pendingSellers > 1 ? "s" : ""} awaiting approval.{" "}
              <a href="/dashboard/admin/users" className="font-semibold underline">Review now</a>
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Revenue (last 30 days)</CardTitle></CardHeader>
              <CardContent><SimpleLineChart data={data.salesByDay} dataKey="revenue" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Orders (last 30 days)</CardTitle></CardHeader>
              <CardContent><SimpleLineChart data={data.salesByDay} dataKey="orders" color="hsl(222 47% 18%)" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top-selling products</CardTitle></CardHeader>
              <CardContent><SimpleBarChart data={data.topProducts} dataKey="totalSales" xKey="title" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Low stock alerts</CardTitle></CardHeader>
              <CardContent>
                {data.lowStock.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nothing running low.</p>
                ) : (
                  <div className="space-y-2">
                    {data.lowStock.map((p) => (
                      <div key={p._id} className="flex items-center justify-between text-sm">
                        <span>{p.title}</span>
                        <Badge variant={p.stock < 50 ? "destructive" : "secondary"}>{p.stock} left</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
