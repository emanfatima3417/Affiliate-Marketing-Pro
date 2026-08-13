"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

// A single shell reused by all four role dashboards. `navItems` describes the
// sidebar for the current role; `allowedRoles` gates access.
export function DashboardShell({ navItems, allowedRoles, title, children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [loading, user, allowedRoles, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container grid gap-6 py-8 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:h-fit">
        <div className="mb-4 flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">{user.role}</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground",
                  active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="mt-2 hidden items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground md:flex"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </nav>
      </aside>
      <div className="min-w-0">
        {title && <h1 className="mb-6 font-display text-2xl font-extrabold">{title}</h1>}
        {children}
      </div>
    </div>
  );
}
