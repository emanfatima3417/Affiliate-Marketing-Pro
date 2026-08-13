const express = require("express");
const { handleStripeWebhook } = require("../controllers/webhookController");

const router = express.Router();

// Note: this route needs the RAW request body (not JSON-parsed) to verify
// the Stripe signature, so it's mounted with express.raw() in server.js
// BEFORE the global express.json() middleware runs on this specific path.
router.post("/stripe", handleStripeWebhook);

module.exports = router;
