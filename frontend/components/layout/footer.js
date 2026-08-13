import Link from "next/link";
import { Link2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/40">
      <div className="container grid gap-8 py-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Link2 className="h-4 w-4" />
            </span>
            Marketplace<span className="text-accent">Pro</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            The affiliate marketplace where sellers list products, affiliates promote them, and every sale is
            tracked to the last cent.
          </p>
        </div>
        <div>
          <p className="font-display text-sm font-bold">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/marketplace">Marketplace</Link></li>
            <li><Link href="/cart">Cart</Link></li>
            <li><Link href="/dashboard/customer/orders">Track an order</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-bold">Earn</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/affiliate-program">Affiliate program</Link></li>
            <li><Link href="/sell">Sell on Marketplace Pro</Link></li>
            <li><Link href="/register">Create an account</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-bold">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/refund-policy">Refund Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Affiliate Marketplace Pro. Built for demonstration purposes.
      </div>
    </footer>
  );
}
