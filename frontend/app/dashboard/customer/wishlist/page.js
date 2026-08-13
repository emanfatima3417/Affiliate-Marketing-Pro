"use client";

import Link from "next/link";
import Image from "next/image";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { customerNav } from "@/components/shared/dashboard-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/context/wishlist-context";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toast-store";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const { items, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();

  return (
    <DashboardShell navItems={customerNav} allowedRoles={["customer", "admin"]} title="Wishlist">
      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart icon on any product to save it here."
          action={<Link href="/marketplace"><Button>Browse marketplace</Button></Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.productId} className="flex flex-col overflow-hidden rounded-lg border bg-card">
              <Link href={`/products/${item.slug}`} className="relative aspect-square bg-secondary">
                {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" sizes="33vw" />}
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <Link href={`/products/${item.slug}`} className="line-clamp-2 font-display text-sm font-bold hover:underline">
                  {item.title}
                </Link>
                <p className="font-display font-extrabold tabular-nums">{formatCurrency(item.price)}</p>
                <div className="mt-auto flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      addItem({ _id: item.productId, title: item.title, price: item.price, images: [{ url: item.image }], slug: item.slug }, 1);
                      toast({ title: "Added to cart", description: item.title });
                    }}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Add to cart
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeFromWishlist(item.productId)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
