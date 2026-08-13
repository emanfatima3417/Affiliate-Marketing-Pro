"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { sellerNav } from "@/components/shared/dashboard-nav";
import { ProductForm } from "@/components/shared/product-form";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get(`/products/${id}`), api.get("/categories")])
      .then(([p, c]) => {
        setProduct(p.product);
        setCategories(c.categories);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  return (
    <DashboardShell navItems={sellerNav} allowedRoles={["seller", "admin"]} title="Edit product">
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !product || !categories ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <ProductForm product={product} categories={categories} onSaved={() => router.push("/dashboard/seller/products")} />
      )}
    </DashboardShell>
  );
}
