"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Lock } from "lucide-react";

// Renders the actual Stripe card fields and handles confirming the payment.
// Must be rendered as a child of <Elements> so the stripe/elements hooks
// below have something to attach to.
export function StripePaymentForm({ amount, shippingValid, onPaymentSucceeded, disabled }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!shippingValid) {
      setError("Please fill in your shipping address above first.");
      return;
    }

    setSubmitting(true);
    setError("");

    // Card validation happens client-side first so we never round-trip to
    // Stripe with an obviously incomplete form.
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setSubmitting(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed. Please check your card details and try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      // Hand off to the parent to actually create the order server-side -
      // the backend independently re-verifies this PaymentIntent with
      // Stripe before it trusts "paid" for a single cent.
      await onPaymentSucceeded(paymentIntent.id);
    } else {
      setError("Payment did not complete. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Payment details
        </p>
        <PaymentElement />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="w-full gap-2" disabled={!stripe || submitting || disabled}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Pay {formatCurrency(amount)}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Test card: 4242 4242 4242 4242, any future date, any CVC, any ZIP.
      </p>
    </form>
  );
}
