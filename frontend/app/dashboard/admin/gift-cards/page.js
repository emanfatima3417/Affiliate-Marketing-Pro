"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/components/shared/dashboard-nav";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toast-store";
import { Loader2, Gift, Copy, Ban } from "lucide-react";

export default function AdminGiftCardsPage() {
  const [giftCards, setGiftCards] = useState(null);
  const [amount, setAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => {
    api.get("/gift-cards").then((data) => setGiftCards(data.giftCards)).catch(() => setGiftCards([]));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const data = await api.post("/gift-cards", {
        amount: Number(amount),
        expiresAt: expiresAt || undefined,
        note,
      });
      toast({ title: "Gift card created", description: data.giftCard.code });
      setAmount("");
      setExpiresAt("");
      setNote("");
      load();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDisable = async (id) => {
    if (!confirm("Disable this gift card? It will no longer be usable at checkout.")) return;
    try {
      await api.put(`/gift-cards/${id}/disable`);
      toast({ title: "Gift card disabled" });
      load();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied", description: code });
  };

  const statusVariant = { active: "accent", depleted: "secondary", disabled: "destructive", expired: "destructive" };

  return (
    <DashboardShell navItems={adminNav} allowedRoles={["admin"]} title="Gift cards">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gift className="h-4 w-4" /> Issue a new gift card</CardTitle>
          <CardDescription>Generates a unique code with the given balance, redeemable at checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiresAt">Expires on (optional)</Label>
              <Input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" placeholder="e.g. Customer support credit" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <Button type="submit" disabled={creating} className="gap-2 sm:col-span-3 sm:w-fit">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create gift card
            </Button>
          </form>
        </CardContent>
      </Card>

      {!giftCards ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : giftCards.length === 0 ? (
        <EmptyState icon={Gift} title="No gift cards issued yet" description="Create one above to get started." />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Initial</th>
                <th className="p-3">Status</th>
                <th className="p-3">Expires</th>
                <th className="p-3">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {giftCards.map((gc) => (
                <tr key={gc._id} className="border-b last:border-0">
                  <td className="p-3">
                    <button onClick={() => copyCode(gc.code)} className="flex items-center gap-1.5 font-mono text-xs font-semibold hover:underline">
                      {gc.code} <Copy className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </td>
                  <td className="p-3 font-semibold tabular-nums">{formatCurrency(gc.balance)}</td>
                  <td className="p-3 text-muted-foreground tabular-nums">{formatCurrency(gc.initialBalance)}</td>
                  <td className="p-3"><Badge variant={statusVariant[gc.status] || "secondary"} className="capitalize">{gc.status}</Badge></td>
                  <td className="p-3 text-muted-foreground">{gc.expiresAt ? formatDate(gc.expiresAt) : "Never"}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(gc.createdAt)}</td>
                  <td className="p-3">
                    {gc.status === "active" && (
                      <Button size="icon" variant="ghost" onClick={() => handleDisable(gc._id)} aria-label="Disable gift card">
                        <Ban className="h-3.5 w-3.5 text-destructive" />
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
