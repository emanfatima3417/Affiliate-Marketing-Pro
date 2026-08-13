"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { affiliateNav } from "@/components/shared/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toast-store";
import { Loader2, Copy, Search } from "lucide-react";

export default function PromoteProductsPage() {
  const [products, setProducts] = useState(null);
  const [links, setLinks] = useState({});
  const [generating, setGenerating] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/affiliates/products").then((data) => setProducts(data.products)).catch(() => setProducts([]));
  }, []);

  const generateLink = async (productId) => {
    setGenerating(productId);
    try {
      const data = await api.get(`/affiliates/link/${productId}`);
      setLinks((prev) => ({ ...prev, [productId]: data.link }));
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied", description: link });
  };

  const filtered = (products || []).filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardShell navItems={affiliateNav} allowedRoles={["affiliate", "admin"]} title="Promote products">
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search products…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {!products ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p._id} className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                {p.images?.[0]?.url && <Image src={p.images[0].url} alt={p.title} fill className="object-cover" sizes="56px" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold">{p.title}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(p.price)} · {p.category?.name}</p>
              </div>
              <Badge variant="accent">{p.commissionPercent}% commission</Badge>

              {links[p._id] ? (
                <div className="flex items-center gap-2">
                  <Input readOnly value={links[p._id]} className="w-56 text-xs" />
                  <Button size="icon" variant="secondary" onClick={() => copyLink(links[p._id])}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => generateLink(p._id)} disabled={generating === p._id}>
                  {generating === p._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get link"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
