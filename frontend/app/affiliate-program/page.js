import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Link2, MousePointerClick, TrendingUp, Wallet, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: Link2, title: "Join free", body: "Register as an affiliate — no fees, no approval wait. You get a unique referral code instantly." },
  { icon: MousePointerClick, title: "Grab a tracked link", body: "Pick any product in the marketplace and generate a unique link for it in one click." },
  { icon: TrendingUp, title: "Share it anywhere", body: "Post it on social, email it, embed it on your site. Every click and conversion is tracked automatically." },
  { icon: Wallet, title: "Get paid", body: "Commission is calculated the instant a sale completes and added straight to your balance." },
];

export default function AffiliateProgramPage() {
  return (
    <div>
      <section className="border-b bg-secondary/30">
        <div className="container py-16 md:py-20">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold">
            For affiliates
          </span>
          <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Promote products you like. Earn a cut of every sale.
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            No inventory, no customer service, no upfront cost — just a tracked link and a transparent commission
            on every purchase it drives.
          </p>
          <Link href="/register?role=affiliate">
            <Button size="lg" className="mt-8">Join the affiliate program</Button>
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
              "Unique tracked links per product",
              "Real-time click & conversion tracking",
              "Transparent per-product commission rates",
              "Full commission history & payout log",
              "Click-through analytics dashboard",
              "No cost to join, ever",
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
