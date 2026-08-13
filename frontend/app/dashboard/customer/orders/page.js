"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { customerNav } from "@/components/shared/dashboard-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { ShoppingBag, Loader2 } from "lucide-react";

const statusColor = {
  processing: "secondary",
  shipped: "default",
  delivered: "accent",
  cancelled: "destructive",
};

function OrdersList() {
  const [orders, setOrders] = useState(null);
  const highlight = useSearchParams().get("highlight");

  useEffect(() => {
    api.get("/orders/mine").then((data) => setOrders(data.orders)).catch(() => setOrders([]));
  }, []);

  if (!orders) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (orders.length === 0) {
    return <EmptyState icon={ShoppingBag} title="No orders yet" description="Once you check out, your orders will show up here." />;
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o._id} className={cn("rounded-lg border bg-card p-5", highlight === o._id && "ring-2 ring-accent")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-display font-bold">{o.orderNumber}</p>
              <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusColor[o.status] || "secondary"} className="capitalize">{o.status}</Badge>
              <Badge variant="outline" className="capitalize">{o.paymentStatus}</Badge>
            </div>
          </div>
          <div className="my-3 h-px bg-border" />
          <div className="space-y-1.5">
            {o.items.map((item) => (
              <div key={item.product} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.quantity} × {item.title}</span>
                <span className="font-semibold tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <p className="font-display font-bold">
              Total: <span className="tabular-nums">{formatCurrency(o.total)}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CustomerOrdersPage() {
  return (
    <DashboardShell navItems={customerNav} allowedRoles={["customer", "admin"]} title="My orders">
      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
        <OrdersList />
      </Suspense>
    </DashboardShell>
  );
}
