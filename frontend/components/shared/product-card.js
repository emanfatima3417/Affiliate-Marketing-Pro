"use client";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { toast } from "@/components/ui/toast-store";
import { ShoppingCart, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductCard({ product }) {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-secondary">
        {product.images?.[0]?.url ? (
          <Image
            src={product.images[0].url}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
        {product.featured && (
          <Badge variant="accent" className="absolute left-2 top-2">
            Featured
          </Badge>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 shadow-sm"
          aria-label="Toggle wishlist"
        >
          <Heart className={cn("h-3.5 w-3.5", wishlisted && "fill-destructive text-destructive")} />
        </button>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category?.name || "General"}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 font-display text-sm font-bold leading-snug hover:underline">{product.title}</h3>
        </Link>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-display text-lg font-extrabold tabular-nums">{formatCurrency(product.price)}</span>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => {
              addItem(product, 1);
              toast({ title: "Added to cart", description: product.title });
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
