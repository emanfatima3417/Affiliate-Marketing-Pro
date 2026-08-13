"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { affiliateNav } from "@/components/shared/dashboard-nav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SimpleLineChart, SimpleBarChart } from "@/components/shared/charts";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AffiliateAnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/affiliates/analytics").then(setData).catch(() => setData(false));
  }, []);

  return (
    <DashboardShell navItems={affiliateNav} allowedRoles={["affiliate", "admin"]} title="Analytics">
      {!data ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Clicks over time</CardTitle></CardHeader>
            <CardContent><SimpleLineChart data={data.clicksByDay} dataKey="clicks" /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Conversions over time</CardTitle></CardHeader>
            <CardContent><SimpleLineChart data={data.clicksByDay} dataKey="conversions" color="hsl(222 47% 18%)" /></CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Top products by clicks</CardTitle></CardHeader>
            <CardContent><SimpleBarChart data={data.topProducts} dataKey="clicks" xKey="title" /></CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
