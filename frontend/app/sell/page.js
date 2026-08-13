import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store, PackagePlus, LineChart, Users, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: Store, title: "Apply as a seller", body: "Register in under a minute. Your account is reviewed by an admin before you can list products." },
  { icon: PackagePlus, title: "List your products", body: "Add title, description, images, price, and stock. Set the commission % you're willing to pay affiliates." },
  { icon: Users, title: "Affiliates promote for you", body: "Every affiliate on the platform can generate a tracked link to your listings — free distribution, paid only on results." },
  { icon: LineChart, title: "Track everything", body: "Watch orders, revenue, and affiliate-driven sales roll in from one seller dashboard." },
];

export default function SellPage() {
  return (
    <div>
      <section className="border-b bg-secondary/30">
        <div className="container py-16 md:py-20">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold">
            For sellers
          </span>
          <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Sell your products. Let an army of affiliates market them.
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Set your own commission rate, keep full control of inventory and pricing, and only pay affiliates when
            they actually drive a sale.
          </p>
          <Link href="/register?role=seller">
            <Button size="lg" className="mt-8">Apply to sell</Button>
          </Link>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-lg border bg-card p-5">
              <span className="text-xs font-bold text-muted-foreground">STEP {i + 1}</span>
              <s.icon className="mt-3 h-5 w-5 text-accent" />
              <h3 className="mt-3 font-display font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="rounded-lg border bg-card p-8">
          <h2 className="font-display text-xl font-bold">What's included</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Unlimited product listings",
              "Cloudinary-backed image uploads",
              "Per-product commission control",
              "Real-time order & stock tracking",
              "Affiliate-driven sales breakdown",
              "Seller earnings dashboard",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-accent" /> {f}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
