"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ProductCard } from "./product-card";
import { Loader2 } from "lucide-react";

export function FeaturedProducts() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/products/featured")
      .then((data) => setProducts(data.products))
      .catch(() => setError("Could not load featured products. Is the API server running?"));
  }, []);

  if (error) {
    return <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{error}</p>;
  }

  if (!products) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No featured products yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}
