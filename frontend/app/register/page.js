"use client";

import { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/components/ui/toast-store";
import { Loader2 } from "lucide-react";

const roleDashboard = {
  admin: "/dashboard/admin",
  seller: "/dashboard/seller",
  affiliate: "/dashboard/affiliate",
  customer: "/dashboard/customer",
};

const ROLES = [
  { value: "customer", label: "Customer" },
  { value: "seller", label: "Seller" },
  { value: "affiliate", label: "Affiliate" },
];

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = ROLES.some((r) => r.value === params.get("role")) ? params.get("role") : "customer";

  const [role, setRole] = useState(defaultRole);
  const [form, setForm] = useState({ name: "", email: "", password: "", storeName: "" });
  // Honeypot: a field real visitors never see or fill in (hidden off-screen
  // below). Bots that auto-fill every input on a form trip this; humans
  // never touch it. If it's non-empty on submit, the backend silently
  // rejects the request.
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recaptchaReady, setRecaptchaReady] = useState(!RECAPTCHA_SITE_KEY);

  const getRecaptchaToken = useCallback(async () => {
    if (!RECAPTCHA_SITE_KEY || typeof window === "undefined" || !window.grecaptcha) return undefined;
    return new Promise((resolve) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "register" }).then(resolve).catch(() => resolve(undefined));
      });
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    try {
      const recaptchaToken = await getRecaptchaToken();
      const user = await register({ ...form, role, companyWebsite, recaptchaToken });
      toast({
        title: "Account created",
        description: role === "seller" ? "Your seller account is pending admin approval." : `Welcome, ${user.name}!`,
      });
      router.push(roleDashboard[user.role] || "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      {RECAPTCHA_SITE_KEY && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
          onLoad={() => setRecaptchaReady(true)}
        />
      )}
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Choose how you want to use Marketplace Pro.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={role} onValueChange={setRole} className="mb-5">
          <TabsList className="grid w-full grid-cols-3">
            {ROLES.map((r) => (
              <TabsTrigger key={r.value} value={r.value}>{r.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field - visually hidden and unreachable by tab order,
              so it's invisible to real users but bots that fill every field
              on a form will trip it. Never marked required, never validated
              client-side (that would give the game away). */}
          <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
            <label htmlFor="companyWebsite">Company website</label>
            <input
              id="companyWebsite"
              name="companyWebsite"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          {role === "seller" && (
            <div className="space-y-1.5">
              <Label htmlFor="storeName">Store name</Label>
              <Input id="storeName" placeholder="e.g. Acme Goods" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-start gap-2">
            <Checkbox id="agreedToTerms" checked={agreedToTerms} onCheckedChange={setAgreedToTerms} className="mt-0.5" />
            <Label htmlFor="agreedToTerms" className="text-xs font-normal leading-snug text-muted-foreground">
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="font-medium text-accent hover:underline">Terms of Service</Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="font-medium text-accent hover:underline">Privacy Policy</Link>.
            </Label>
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading || !recaptchaReady}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
          {RECAPTCHA_SITE_KEY && (
            <p className="text-center text-[11px] text-muted-foreground">
              This site is protected by reCAPTCHA and the Google{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">Privacy Policy</a>{" "}
              and{" "}
              <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline">Terms of Service</a>{" "}
              apply.
            </p>
          )}
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="font-semibold text-accent hover:underline">Log in</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
