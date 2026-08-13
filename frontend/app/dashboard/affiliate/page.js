"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { affiliateNav } from "@/components/shared/dashboard-nav";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import api from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { MousePointerClick, TrendingUp, Wallet, Percent, Loader2, Link2, Sprout } from "lucide-react";

export default function AffiliateDashboardPage() {
  const [affiliate, setAffiliate] = useState(null);
  const [notJoined, setNotJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  const load = () => {
    api
      .get("/affiliates/me")
      .then((data) => setAffiliate(data.affiliate))
      .catch(() => setNotJoined(true));
  };

  useEffect(() => { load(); }, []);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post("/affiliates/join", {});
      setNotJoined(false);
      load();
    } finally {
      setJoining(false);
    }
  };

  if (notJoined) {
    return (
      <DashboardShell navItems={affiliateNav} allowedRoles={["affiliate", "admin"]} title="Affiliate overview">
        <EmptyState
          icon={Sprout}
          title="You haven't joined the affiliate program yet"
          description="Join for free to get a unique referral code and start generating tracked links."
          action={<Button onClick={handleJoin} disabled={joining}>{joining ? "Joining…" : "Join affiliate program"}</Button>}
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell navItems={affiliateNav} allowedRoles={["affiliate", "admin"]} title="Affiliate overview">
      {!affiliate ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Your referral code</p>
              <p className="font-display text-xl font-extrabold tracking-wide">{affiliate.code}</p>
            </div>
            <Link href="/dashboard/affiliate/products">
              <Button className="gap-1.5"><Link2 className="h-4 w-4" /> Generate a link</Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total clicks" value={formatNumber(affiliate.totalClicks)} icon={MousePointerClick} />
            <StatCard label="Conversions" value={formatNumber(affiliate.totalConversions)} icon={TrendingUp} />
            <StatCard label="Conversion rate" value={`${affiliate.conversionRate || 0}%`} icon={Percent} />
            <StatCard label="Total earnings" value={formatCurrency(affiliate.totalEarnings)} icon={Wallet} accent />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StatCard label="Available balance" value={formatCurrency(affiliate.balance)} icon={Wallet} accent trend="Unpaid earnings" />
            <StatCard label="Total paid out" value={formatCurrency(affiliate.totalPaid)} icon={Wallet} />
          </div>
        </>
      )}
    </DashboardShell>
  );
}
