"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { sellerNav } from "@/components/shared/dashboard-nav";
import { ProductForm } from "@/components/shared/product-form";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function NewProductPage() {
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    api.get("/categories").then((data) => setCategories(data.categories)).catch(() => setCategories([]));
  }, []);

  return (
    <DashboardShell navItems={sellerNav} allowedRoles={["seller", "admin"]} title="New product">
      {!categories ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <ProductForm categories={categories} />
      )}
    </DashboardShell>
  );
}
