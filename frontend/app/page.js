import Link from "next/link";
import { ArrowRight, Link2, TrendingUp, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeaturedProducts } from "@/components/shared/featured-products";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-secondary/30">
        <div className="container grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold">
              <Link2 className="h-3 w-3 text-accent" /> Every sale, traced to its source
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] md:text-5xl">
              One marketplace.
              <br />
              Three ways to <span className="text-accent">earn</span>.
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              List products as a seller, promote them as an affiliate, or just shop — Marketplace Pro tracks
              every click and sale so commissions land in the right hands automatically.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/marketplace">
                <Button size="lg" className="gap-2">
                  Browse the marketplace <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/affiliate-program">
                <Button size="lg" variant="outline">
                  Become an affiliate
                </Button>
              </Link>
            </div>
          </div>

          {/* Signature element: the ledger chain visualizing product -> link -> sale -> commission */}
          <div className="flex flex-col justify-center gap-3">
            {[
              { label: "Product listed", detail: "Seller sets price & commission %", icon: Store },
              { label: "Link generated", detail: "Affiliate gets a unique tracked URL", icon: Link2 },
              { label: "Sale happens", detail: "Customer checks out via the link", icon: TrendingUp },
              { label: "Commission paid", detail: "Split calculated instantly, no spreadsheets", icon: ShieldCheck },
            ].map((step, i) => (
              <div key={step.label} className="ledger-connector flex items-center gap-4 rounded-lg border bg-card p-4 pl-3">
                <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="relative z-10 flex items-center gap-3 rounded-md bg-card pl-1">
                  <step.icon className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-sm font-bold">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role callouts */}
      <section className="container py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "For sellers",
              body: "List products, set your own commission rate, and let a network of affiliates sell for you.",
              href: "/sell",
              cta: "Start selling",
            },
            {
              title: "For affiliates",
              body: "Grab a tracked link for any product, share it anywhere, and earn a cut of every sale it drives.",
              href: "/affiliate-program",
              cta: "Join free",
            },
            {
              title: "For customers",
              body: "Shop a growing catalog of vetted products with transparent pricing and simple checkout.",
              href: "/marketplace",
              cta: "Start shopping",
            },
          ].map((card) => (
            <div key={card.title} className="rounded-lg border bg-card p-6">
              <h3 className="font-display text-lg font-bold">{card.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
              <Link href={card.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                {card.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container pb-20">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold">Featured products</h2>
            <p className="text-sm text-muted-foreground">Hand-picked listings currently driving the most affiliate sales.</p>
          </div>
          <Link href="/marketplace" className="hidden text-sm font-semibold text-accent hover:underline md:block">
            View all →
          </Link>
        </div>
        <FeaturedProducts />
      </section>
    </div>
  );
}
