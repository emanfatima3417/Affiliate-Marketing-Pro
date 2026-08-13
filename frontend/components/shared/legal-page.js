import Link from "next/link";
import { ShieldAlert } from "lucide-react";

// Shared shell for Terms/Privacy/Refund pages - keeps typography and the
// "this is a template, not legal advice" banner consistent across all three
// without repeating markup in each page.
export function LegalPageShell({ title, lastUpdated, children }) {
  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-8 flex items-start gap-3 rounded-lg border border-yellow-300/50 bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-200">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This page is a starting template, not legal advice. Replace the bracketed placeholders with your real
          business details and have a qualified attorney review it — requirements vary significantly by state and
          country, and this document alone doesn&apos;t make your business compliant.
        </p>
      </div>

      <h1 className="font-display text-3xl font-extrabold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

      <div className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-foreground">{children}</div>

      <div className="mt-12 flex gap-4 border-t pt-6 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        <Link href="/refund-policy" className="hover:underline">Refund Policy</Link>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-2 space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}
