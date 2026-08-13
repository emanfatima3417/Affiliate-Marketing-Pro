"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/components/shared/dashboard-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingBag, Loader2 } from "lucide-react";

const statusColor = { processing: "secondary", shipped: "default", delivered: "accent", cancelled: "destructive" };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get("/admin/orders").then((data) => setOrders(data.orders)).catch(() => setOrders([]));
  }, []);

  return (
    <DashboardShell navItems={adminNav} allowedRoles={["admin"]} title="All orders">
      {!orders ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders yet" />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Date</th>
                <th className="p-3">Items</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{o.orderNumber}</td>
                  <td className="p-3 text-muted-foreground">{o.customer?.name}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                  <td className="p-3 text-muted-foreground">{o.items.length}</td>
                  <td className="p-3"><Badge variant={statusColor[o.status] || "secondary"} className="capitalize">{o.status}</Badge></td>
                  <td className="p-3"><Badge variant="outline" className="capitalize">{o.paymentStatus}</Badge></td>
                  <td className="p-3 text-right font-semibold tabular-nums">{formatCurrency(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
