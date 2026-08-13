"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StripePaymentForm } from "@/components/shared/stripe-payment-form";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/toast-store";
import { Loader2, ShieldAlert } from "lucide-react";

const REQUIRED_FIELDS = ["fullName", "address", "city", "state", "postalCode", "phone"];

export default function CheckoutPage() {
  const { items, subtotal, clearCart, getAffiliateCode } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "USA",
    phone: "",
  });

  const [clientSecret, setClientSecret] = useState(null);
  const [amount, setAmount] = useState(subtotal);
  const [mockMode, setMockMode] = useState(false);
  const [intentLoading, setIntentLoading] = useState(true);
  const [intentError, setIntentError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?redirect=/checkout");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, fullName: f.fullName || user.name }));
  }, [user]);

  // Create the PaymentIntent as soon as we know who's checking out and what
  // they're buying. The backend recomputes the total from real product
  // prices - we only render whatever it tells us to charge.
  useEffect(() => {
    if (!user || items.length === 0) return;
    setIntentLoading(true);
    setIntentError("");

    api
      .post("/orders/create-payment-intent", {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        affiliateCode: getAffiliateCode() || undefined,
      })
      .then((data) => {
        setAmount(data.amount);
        if (data.mock) {
          setMockMode(true);
        } else {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((err) => setIntentError(err.message))
      .finally(() => setIntentLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, items.length]);

  const shippingValid = REQUIRED_FIELDS.every((f) => form[f].trim().length > 0);

  const finalizeOrder = useCallback(
    async (stripePaymentIntentId) => {
      if (!agreedToPolicies) {
        toast({ title: "Please agree to the policies", description: "Check the box below before placing your order.", variant: "destructive" });
        return;
      }
      setPlacingOrder(true);
      try {
        const { order } = await api.post("/orders", {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingAddress: form,
          paymentMethod: "stripe",
          stripePaymentIntentId: stripePaymentIntentId || undefined,
          affiliateCode: getAffiliateCode() || undefined,
        });

        clearCart();
        toast({ title: "Order placed!", description: `Order #${order.orderNumber}` });
        router.push(`/dashboard/customer/orders?highlight=${order._id}`);
      } catch (err) {
        toast({ title: "Order failed", description: err.message, variant: "destructive" });
        setPlacingOrder(false);
      }
    },
    [items, form, getAffiliateCode, clearCart, router, agreedToPolicies]
  );

  const handleMockSubmit = async (e) => {
    e.preventDefault();
    if (!shippingValid) return;
    await finalizeOrder(null);
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link href="/marketplace">
          <Button className="mt-4">Browse marketplace</Button>
        </Link>
      </div>
    );
  }

  const stripePromise = getStripe();

  return (
    <div className="container py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold">Checkout</h1>
      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <h2 className="font-display font-bold">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Full name</Label>
                <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address</Label>
                <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Postal code</Label>
                <Input required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border bg-card p-4">
            <Checkbox id="agreedToPolicies" checked={agreedToPolicies} onCheckedChange={setAgreedToPolicies} className="mt-0.5" />
            <Label htmlFor="agreedToPolicies" className="text-xs font-normal leading-snug text-muted-foreground">
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="font-medium text-accent hover:underline">Terms of Service</Link>,{" "}
              <Link href="/privacy" target="_blank" className="font-medium text-accent hover:underline">Privacy Policy</Link>, and{" "}
              <Link href="/refund-policy" target="_blank" className="font-medium text-accent hover:underline">Refund Policy</Link>.
            </Label>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 font-display font-bold">Payment</h2>

            {intentLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : intentError ? (
              <p className="text-sm text-destructive">{intentError}</p>
            ) : mockMode ? (
              <form onSubmit={handleMockSubmit} className="space-y-4">
                <div className="flex items-start gap-2 rounded-md border border-yellow-300/50 bg-yellow-50 p-3 text-xs text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-200">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>
                    Stripe isn&apos;t configured on this server (no <code>STRIPE_SECRET_KEY</code>), so this order
                    will be placed in demo mode without collecting a real card. Add your Stripe keys to enable real
                    payments.
                  </span>
                </div>
                <Button type="submit" size="lg" className="w-full gap-2" disabled={!shippingValid || !agreedToPolicies || placingOrder}>
                  {placingOrder && <Loader2 className="h-4 w-4 animate-spin" />}
                  Place demo order — {formatCurrency(amount)}
                </Button>
              </form>
            ) : clientSecret && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm
                  amount={amount}
                  shippingValid={shippingValid}
                  onPaymentSucceeded={finalizeOrder}
                  disabled={placingOrder || !agreedToPolicies}
                />
              </Elements>
            ) : (
              <p className="text-sm text-destructive">
                Payment could not be initialized. Check that <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> is set.
              </p>
            )}
          </div>
        </div>

        <div className="h-fit rounded-lg border bg-card p-5">
          <h2 className="mb-4 font-display font-bold">Order summary</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="line-clamp-1 pr-2 text-muted-foreground">
                  {item.quantity} × {item.title}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="my-3 h-px bg-border" />
          <div className="flex justify-between">
            <span className="font-display font-bold">Total</span>
            <span className="font-display text-lg font-extrabold tabular-nums">{formatCurrency(amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
