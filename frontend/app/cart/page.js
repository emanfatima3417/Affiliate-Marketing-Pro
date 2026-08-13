"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the marketplace and add something you like."
          action={
            <Link href="/marketplace">
              <Button>Browse marketplace</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold">Your cart</h1>
      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 rounded-lg border bg-card p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill className="object-cover" sizes="80px" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.slug}`} className="line-clamp-1 font-display text-sm font-bold hover:underline">
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
              </div>
              <div className="flex items-center rounded-md border">
                <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="w-20 shrink-0 text-right font-display font-bold tabular-nums">
                {formatCurrency(item.price * item.quantity)}
              </p>
              <Button variant="ghost" size="icon" onClick={() => removeItem(item.productId)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-lg border bg-card p-5">
          <h2 className="font-display font-bold">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-semibold">Free</span>
          </div>
          <div className="my-3 h-px bg-border" />
          <div className="flex justify-between">
            <span className="font-display font-bold">Total</span>
            <span className="font-display text-lg font-extrabold tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <Link href="/checkout">
            <Button className="mt-5 w-full gap-2">
              Checkout <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
