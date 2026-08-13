"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Menu, X, LayoutDashboard, LogOut, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { cn, initials } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/affiliate-program", label: "Become an Affiliate" },
  { href: "/sell", label: "Sell on Marketplace Pro" },
];

const roleDashboard = {
  admin: "/dashboard/admin",
  seller: "/dashboard/seller",
  affiliate: "/dashboard/affiliate",
  customer: "/dashboard/customer",
};

export function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Link2 className="h-4 w-4" />
          </span>
          Marketplace<span className="text-accent">Pro</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <div className="hidden items-center gap-1.5 md:flex">
              <Link href={roleDashboard[user.role] || "/dashboard/customer"}>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t md:hidden">
          <div className="container flex flex-col gap-3 py-4">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-border" />
            {user ? (
              <>
                <Link href={roleDashboard[user.role] || "/dashboard/customer"} className="text-sm font-semibold" onClick={() => setOpen(false)}>
                  Dashboard ({initials(user.name)})
                </Link>
                <button onClick={logout} className="text-left text-sm text-muted-foreground">
                  Log out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setOpen(false)}>
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
