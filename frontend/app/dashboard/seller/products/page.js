"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { sellerNav } from "@/components/shared/dashboard-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toast-store";
import { Package, Plus, Loader2, Pencil, Trash2 } from "lucide-react";

export default function SellerProductsPage() {
  const [products, setProducts] = useState(null);

  const load = () => {
    api.get("/products/mine/list").then((data) => setProducts(data.products)).catch(() => setProducts([]));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    try {
      await api.del(`/products/${id}`);
      toast({ title: "Product deleted", description: title });
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <DashboardShell navItems={sellerNav} allowedRoles={["seller", "admin"]} title="My products">
      <div className="mb-4 flex justify-end">
        <Link href="/dashboard/seller/products/new">
          <Button className="gap-1.5"><Plus className="h-4 w-4" /> New product</Button>
        </Link>
      </div>

      {!products ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Create your first listing to start selling."
          action={<Link href="/dashboard/seller/products/new"><Button>Create product</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p._id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                {p.images?.[0]?.url && <Image src={p.images[0].url} alt={p.title} fill className="object-cover" sizes="56px" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.stock} in stock · {p.commissionPercent}% commission</p>
              </div>
              <Badge variant={p.status === "active" ? "accent" : "secondary"} className="capitalize">{p.status}</Badge>
              <p className="w-20 text-right font-semibold tabular-nums">{formatCurrency(p.price)}</p>
              <Link href={`/dashboard/seller/products/${p._id}/edit`}>
                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(p._id, p.title)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
