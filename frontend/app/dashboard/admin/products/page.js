"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/components/shared/dashboard-nav";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toast-store";
import { Loader2, Search, Check } from "lucide-react";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState({});

  const load = () => {
    api.get("/admin/inventory").then((data) => setProducts(data.products)).catch(() => setProducts([]));
  };

  useEffect(() => { load(); }, []);

  const saveCommission = async (id) => {
    const value = editing[id];
    if (value === undefined) return;
    try {
      await api.put(`/admin/products/${id}/commission`, { commissionPercent: Number(value) });
      toast({ title: "Commission updated" });
      load();
      setEditing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filtered = (products || []).filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardShell navItems={adminNav} allowedRoles={["admin"]} title="Inventory overview">
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search products…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {!products ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Seller</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3">Commission %</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3 text-muted-foreground">{p.seller?.storeName || p.seller?.name}</td>
                  <td className="p-3 tabular-nums">{formatCurrency(p.price)}</td>
                  <td className="p-3">
                    <Badge variant={p.stock < 100 ? "destructive" : "secondary"}>{p.stock}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={p.status === "active" ? "accent" : "secondary"} className="capitalize">{p.status}</Badge>
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="0"
                      max="90"
                      className="h-8 w-20"
                      defaultValue={p.commissionPercent}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [p._id]: e.target.value }))}
                    />
                  </td>
                  <td className="p-3">
                    {editing[p._id] !== undefined && (
                      <Button size="icon" variant="secondary" onClick={() => saveCommission(p._id)}>
                        <Check className="h-3.5 w-3.5" />
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
