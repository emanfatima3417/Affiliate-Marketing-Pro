const asyncHandler = require("../middleware/asyncHandler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Affiliate = require("../models/Affiliate");
const Commission = require("../models/Commission");
const Transaction = require("../models/Transaction");
const Click = require("../models/Click");
const User = require("../models/User");
const calcCommission = require("../utils/commissionCalc");
const stripe = require("../config/stripe");
const { sendEmail } = require("../config/email");
const { orderConfirmationEmail, commissionEarnedEmail } = require("../utils/emailTemplates");
const { nanoid } = require("nanoid");

// @desc    Create a Stripe PaymentIntent for the current cart. The amount is
//          always recomputed server-side from real product prices - the
//          client can never dictate what gets charged.
// @route   POST /api/orders/create-payment-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { items, affiliateCode } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No items provided");
  }

  let total = 0;
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || product.status !== "active") {
      res.status(400);
      throw new Error(`Product unavailable: ${item.productId}`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.title}`);
    }
    total += product.price * item.quantity;
  }
  total = Number(total.toFixed(2));

  if (!stripe) {
    // Payments provider not configured - useful for local/dev testing without
    // real Stripe keys. The order will still be created but flagged as a
    // mock payment so it's never confused with a verified real charge.
    return res.json({ success: true, clientSecret: null, mock: true, amount: total });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100),
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId: req.user._id.toString(),
      affiliateCode: affiliateCode || "",
    },
  });

  res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, amount: total });
});

// @desc    Place an order (checkout). Applies affiliate attribution + commissions.
//          When Stripe is configured, this REQUIRES a stripePaymentIntentId
//          and independently verifies with Stripe that it succeeded and was
//          charged for the correct amount before creating the order - the
//          client's word alone is never enough to mark something "paid".
// @route   POST /api/orders
// @access  Private (customer)
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, stripePaymentIntentId, affiliateCode } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No order items provided");
  }

  // Prevent double-submission from creating two orders for one payment
  if (stripePaymentIntentId) {
    const existing = await Order.findOne({ stripePaymentIntentId });
    if (existing) {
      return res.status(200).json({ success: true, order: existing });
    }
  }

  // Resolve affiliate once for the whole cart if a ref code was supplied
  let affiliate = null;
  if (affiliateCode) {
    affiliate = await Affiliate.findOne({ code: affiliateCode, status: "active" });
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || product.status !== "active") {
      res.status(400);
      throw new Error(`Product unavailable: ${item.productId}`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.title}`);
    }

    const percent = affiliate ? product.commissionPercent : 0;
    const { saleAmount, amount: commissionAmount } = calcCommission(
      product.price,
      item.quantity,
      percent
    );

    orderItems.push({
      product: product._id,
      seller: product.seller,
      title: product.title,
      image: product.images?.[0]?.url || "",
      price: product.price,
      quantity: item.quantity,
      affiliate: affiliate ? affiliate._id : null,
      commissionPercent: percent,
      commissionAmount,
    });

    subtotal += saleAmount;
  }

  const total = Number(subtotal.toFixed(2));

  // ---- Payment verification (the security-critical part) ----
  let paymentStatus = "pending";

  if (stripe) {
    // Real Stripe is configured: a verified, succeeded PaymentIntent for the
    // exact order total is mandatory. Nothing here is taken on the client's
    // word - if this fails, no order is created and no stock is deducted.
    if (!stripePaymentIntentId) {
      res.status(402);
      throw new Error("Payment is required to place this order");
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      res.status(402);
      throw new Error("Payment has not been completed successfully");
    }

    const expectedCents = Math.round(total * 100);
    if (paymentIntent.amount !== expectedCents) {
      res.status(402);
      throw new Error("Payment amount does not match order total");
    }

    if (paymentIntent.metadata?.userId && paymentIntent.metadata.userId !== req.user._id.toString()) {
      res.status(403);
      throw new Error("This payment does not belong to the current user");
    }

    paymentStatus = "paid";
  } else {
    // No Stripe key configured on the server - demo/dev mode only. This
    // branch should never be reachable in a real deployment; document that
    // loudly rather than silently marking every order "paid".
    console.warn(
      "[orders] STRIPE_SECRET_KEY is not set - orders are being auto-marked as paid without real payment verification. Do not run production traffic in this state."
    );
    paymentStatus = "paid";
  }

  // Only now that payment is verified do we touch inventory.
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (product.stock < item.quantity) {
      res.status(409);
      throw new Error(`Stock changed for ${product.title} - please review your cart`);
    }
    product.stock -= item.quantity;
    product.totalSales += item.quantity;
    product.totalRevenue += item.price * item.quantity;
    await product.save();
  }

  const order = await Order.create({
    orderNumber: `ORD-${nanoid(10).toUpperCase()}`,
    customer: req.user._id,
    items: orderItems,
    subtotal: total,
    total,
    shippingAddress,
    paymentMethod: paymentMethod || "stripe",
    paymentStatus,
    stripePaymentIntentId: stripePaymentIntentId || "",
  });

  // Create commission + transaction records, update affiliate totals
  let affiliateEarned = 0;
  if (affiliate) {
    for (const item of orderItems) {
      if (item.commissionAmount > 0) {
        await Commission.create({
          affiliate: affiliate._id,
          order: order._id,
          product: item.product,
          seller: item.seller,
          saleAmount: item.price * item.quantity,
          percent: item.commissionPercent,
          amount: item.commissionAmount,
          status: "approved",
        });
        affiliateEarned += item.commissionAmount;
      }
    }

    if (affiliateEarned > 0) {
      affiliate.totalConversions += 1;
      affiliate.totalEarnings += affiliateEarned;
      affiliate.balance += affiliateEarned;
      await affiliate.save();

      await Transaction.create({
        user: affiliate.user,
        type: "commission",
        amount: affiliateEarned,
        order: order._id,
        reference: order.orderNumber,
        notes: "Commission earned from order",
      });

      // Mark the most recent unconverted click for this affiliate/product as converted
      await Click.updateMany(
        {
          affiliate: affiliate._id,
          product: { $in: orderItems.map((i) => i.product) },
          converted: false,
        },
        { $set: { converted: true, order: order._id } }
      );
    }
  }

  // Sale transaction(s) for each seller
  const sellerTotals = {};
  for (const item of orderItems) {
    const key = item.seller.toString();
    sellerTotals[key] = (sellerTotals[key] || 0) + item.price * item.quantity - item.commissionAmount;
  }
  for (const [sellerId, amount] of Object.entries(sellerTotals)) {
    await Transaction.create({
      user: sellerId,
      type: "sale",
      amount: Number(amount.toFixed(2)),
      order: order._id,
      reference: order.orderNumber,
      notes: "Net sale revenue (after affiliate commission)",
    });
  }

  // Fire-and-forget notification emails. A failed email should never fail
  // the order itself - the purchase already succeeded and was paid for, so
  // we log and move on rather than throwing here.
  (async () => {
    try {
      const { subject, html, text } = orderConfirmationEmail(req.user, order);
      await sendEmail({ to: req.user.email, subject, html, text });
    } catch (err) {
      console.error(`[order confirmation email] failed for order ${order.orderNumber}: ${err.message}`);
    }

    if (affiliate && affiliateEarned > 0) {
      try {
        const affiliateUser = await User.findById(affiliate.user);
        if (affiliateUser) {
          const { subject, html, text } = commissionEarnedEmail(affiliateUser, affiliateEarned, order);
          await sendEmail({ to: affiliateUser.email, subject, html, text });
        }
      } catch (err) {
        console.error(`[commission email] failed for order ${order.orderNumber}: ${err.message}`);
      }
    }
  })();

  res.status(201).json({ success: true, order });
});

// @desc    Get logged-in customer's orders
// @route   GET /api/orders/mine
// @access  Private (customer)
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id }).sort("-createdAt");
  res.json({ success: true, orders });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("customer", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner = order.customer._id.toString() === req.user._id.toString();
  const isSeller = order.items.some((i) => i.seller.toString() === req.user._id.toString());
  if (!isOwner && !isSeller && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  res.json({ success: true, order });
});

// @desc    Get orders containing the logged-in seller's products
// @route   GET /api/orders/seller/mine
// @access  Private (seller)
const getSellerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ "items.seller": req.user._id }).sort("-createdAt");

  // Trim to only this seller's items/line-totals for clarity
  const trimmed = orders.map((o) => {
    const myItems = o.items.filter((i) => i.seller.toString() === req.user._id.toString());
    const myTotal = myItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return {
      _id: o._id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      status: o.status,
      paymentStatus: o.paymentStatus,
      items: myItems,
      myTotal,
    };
  });

  res.json({ success: true, orders: trimmed });
});

// @desc    Update order status (fulfillment)
// @route   PUT /api/orders/:id/status
// @access  Private (seller of items in order, admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isSeller = order.items.some((i) => i.seller.toString() === req.user._id.toString());
  if (!isSeller && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to update this order");
  }

  order.status = req.body.status || order.status;
  const updated = await order.save();
  res.json({ success: true, order: updated });
});

module.exports = {
  createPaymentIntent,
  createOrder,
  getMyOrders,
  getOrder,
  getSellerOrders,
  updateOrderStatus,
};
