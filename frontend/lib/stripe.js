import { loadStripe } from "@stripe/stripe-js";

// Loading Stripe.js is expensive - do it once and reuse the same promise
// across the app rather than re-loading it on every render.
let stripePromise;

export function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key || key.includes("xxxx")) {
      // No real publishable key configured - Elements simply won't mount,
      // and the checkout page falls back to its no-Stripe demo path.
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
