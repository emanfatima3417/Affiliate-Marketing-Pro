"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { sellerNav } from "@/components/shared/dashboard-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toast-store";
import { ShoppingBag, Loader2 } from "lucide-react";

const STATUSES = ["processing", "shipped", "delivered", "cancelled"];

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get("/orders/seller/mine").then((data) => setOrders(data.orders)).catch(() => setOrders([]));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
      toast({ title: "Order updated", description: `Marked as ${status}` });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <DashboardShell navItems={sellerNav} allowedRoles={["seller", "admin"]} title="Orders">
      {!orders ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders yet" description="Orders containing your products will show up here." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-bold">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                </div>
                <Select value={o.status} onValueChange={(v) => updateStatus(o._id, v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="my-2 h-px bg-border" />
              <div className="space-y-1">
                {o.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.quantity} × {item.title}{item.affiliate ? " (via affiliate)" : ""}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-end text-sm font-display font-bold">
                My total: <span className="ml-1 tabular-nums">{formatCurrency(o.myTotal)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
