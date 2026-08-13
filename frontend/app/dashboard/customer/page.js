"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { customerNav } from "@/components/shared/dashboard-nav";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingBag, Package, Wallet, ArrowRight } from "lucide-react";

export default function CustomerDashboardPage() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get("/orders/mine").then((data) => setOrders(data.orders)).catch(() => setOrders([]));
  }, []);

  const totalSpent = (orders || []).reduce((sum, o) => sum + o.total, 0);
  const recent = (orders || []).slice(0, 5);

  return (
    <DashboardShell navItems={customerNav} allowedRoles={["customer", "admin"]} title="My account">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={orders ? orders.length : "—"} icon={ShoppingBag} />
        <StatCard label="Total spent" value={formatCurrency(totalSpent)} icon={Wallet} accent />
        <StatCard label="Items tracked" value={orders ? orders.reduce((s, o) => s + o.items.length, 0) : "—"} icon={Package} />
      </div>

      <div className="mt-8 rounded-lg border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-bold">Recent orders</h2>
          <Link href="/dashboard/customer/orders" className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No orders yet.{" "}
            <Link href="/marketplace" className="font-semibold text-accent hover:underline">Browse the marketplace</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((o) => (
              <div key={o._id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                </div>
                <Badge variant="secondary" className="capitalize">{o.status}</Badge>
                <p className="font-semibold tabular-nums">{formatCurrency(o.total)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
