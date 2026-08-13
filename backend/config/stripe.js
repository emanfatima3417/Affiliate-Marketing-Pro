const Stripe = require("stripe");

// Payments are abstracted behind this module so the provider can be swapped
// out later (PayPal, Paddle, etc.) without touching controller logic.
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

module.exports = stripe;
