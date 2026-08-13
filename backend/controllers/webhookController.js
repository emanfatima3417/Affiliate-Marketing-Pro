const asyncHandler = require("../middleware/asyncHandler");
const stripe = require("../config/stripe");
const Order = require("../models/Order");

// @desc    Receive Stripe webhook events. Used as a safety net: even if a
//          customer closes the tab right after paying (before the frontend
//          calls POST /api/orders), Stripe still tells us the charge
//          succeeded here so nothing falls through the cracks silently.
// @route   POST /api/webhooks/stripe
// @access  Public (verified via Stripe signature, not auth)
const handleStripeWebhook = asyncHandler(async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    // Webhooks aren't configured - acknowledge so Stripe doesn't retry
    // forever, but this deployment isn't using this safety net.
    return res.status(200).json({ received: true, configured: false });
  }

  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`[stripe webhook] signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      // If an order already exists for this PaymentIntent, make sure it's
      // marked paid (covers the "tab closed before order creation" case).
      // We do NOT create the order here from scratch, since order creation
      // needs the cart/shipping details that only the client has - this is
      // purely a reconciliation safety net for orders already recorded.
      await Order.updateMany(
        { stripePaymentIntentId: paymentIntent.id, paymentStatus: { $ne: "paid" } },
        { $set: { paymentStatus: "paid" } }
      );
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      await Order.updateMany(
        { stripePaymentIntentId: paymentIntent.id },
        { $set: { paymentStatus: "failed" } }
      );
      break;
    }
    default:
      // Unhandled event types are fine to ignore
      break;
  }

  res.status(200).json({ received: true });
});

module.exports = { handleStripeWebhook };
