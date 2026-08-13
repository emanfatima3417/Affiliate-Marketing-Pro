"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { toast } from "@/components/ui/toast-store";
import { Loader2, ShoppingCart, Minus, Plus, ShieldCheck, Store } from "lucide-react";

function ProductDetails() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api
      .get(`/products/${slug}`)
      .then((data) => setProduct(data.product))
      .catch(() => setError("Product not found."));
  }, [slug]);

  // If this page was reached via an affiliate link (?ref=CODE), remember the
  // code for checkout attribution and log a click against the affiliate.
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref || !product) return;

    localStorage.setItem("amp_ref_code", ref);
    api.post("/affiliates/track-click", { code: ref, productId: product._id }).catch(() => {});
  }, [searchParams, product]);

  if (error) {
    return <div className="container py-20 text-center text-muted-foreground">{error}</div>;
  }

  if (!product) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <div className="container py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg border bg-secondary">
          {product.images?.[0]?.url ? (
            <Image src={product.images[0].url} alt={product.title} fill className="object-cover" sizes="50vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
          )}
        </div>

        <div>
          <Link href="/marketplace" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:underline">
            {product.category?.name || "Marketplace"}
          </Link>
          <h1 className="mt-2 font-display text-3xl font-extrabold">{product.title}</h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-3xl font-extrabold text-accent tabular-nums">{formatCurrency(product.price)}</span>
            {outOfStock ? (
              <Badge variant="destructive">Out of stock</Badge>
            ) : (
              <Badge variant="secondary">{product.stock} in stock</Badge>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" /> Sold by {product.seller?.storeName || product.seller?.name || "Marketplace Pro"}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" /> Buyer protection included on every order
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center rounded-md border">
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              size="lg"
              disabled={outOfStock}
              className="gap-2"
              onClick={() => {
                addItem(product, qty);
                toast({ title: "Added to cart", description: `${qty} × ${product.title}` });
              }}
            >
              <ShoppingCart className="h-4 w-4" /> Add to cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <ProductDetails />
    </Suspense>
  );
}
