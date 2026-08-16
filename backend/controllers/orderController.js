const asyncHandler = require("../middleware/asyncHandler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Affiliate = require("../models/Affiliate");
const Commission = require("../models/Commission");
const Transaction = require("../models/Transaction");
const Click = require("../models/Click");
const User = require("../models/User");
const GiftCard = require("../models/GiftCard");
const calcCommission = require("../utils/commissionCalc");
const stripe = require("../config/stripe");
const { sendEmail } = require("../config/email");
const { orderConfirmationEmail, commissionEarnedEmail } = require("../utils/emailTemplates");
const { nanoid } = require("nanoid");

// Looks up a gift card by code and returns how much of `total` it can cover
// right now. Read-only - does not touch the balance. Returns null if the
// code doesn't exist or isn't currently usable (expired/disabled/depleted).
async function previewGiftCard(code, total) {
  if (!code) return null;
  const giftCard = await GiftCard.findOne({ code: code.trim().toUpperCase() });
  if (!giftCard || !giftCard.isUsable()) return null;
  const applicable = Number(Math.min(giftCard.balance, total).toFixed(2));
  return { giftCard, applicable, remaining: Number((total - applicable).toFixed(2)) };
}

// @desc    Create a Stripe PaymentIntent for the current cart. The amount is
//          always recomputed server-side from real product prices - the
//          client can never dictate what gets charged. If a gift card code
//          is supplied, the PaymentIntent is created only for whatever's
//          left over after the gift card's contribution.
// @route   POST /api/orders/create-payment-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { items, affiliateCode, giftCardCode } = req.body;

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

  let giftCardApplied = 0;
  let remaining = total;

  if (giftCardCode) {
    const preview = await previewGiftCard(giftCardCode, total);
    if (!preview) {
      res.status(400);
      throw new Error("This gift card code is invalid or can't be used.");
    }
    giftCardApplied = preview.applicable;
    remaining = preview.remaining;
  }

  if (remaining <= 0) {
    return res.json({
      success: true,
      clientSecret: null,
      giftCardFullyCovers: true,
      amount: total,
      giftCardApplied,
      remaining: 0,
    });
  }

  if (!stripe) {
    return res.json({ success: true, clientSecret: null, mock: true, amount: total, giftCardApplied, remaining });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(remaining * 100),
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId: req.user._id.toString(),
      affiliateCode: affiliateCode || "",
      giftCardCode: giftCardCode || "",
    },
  });

  res.json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: total,
    giftCardApplied,
    remaining,
  });
});

// @desc    Place an order (checkout). Applies affiliate attribution +
//          commissions, and gift card redemption if a code was supplied.
//          When Stripe is configured and the order isn't fully covered by a
//          gift card, this REQUIRES a stripePaymentIntentId and
//          independently verifies with Stripe that it succeeded and was
//          charged for exactly the remaining amount - the client's word
//          alone is never enough to mark something "paid".
// @route   POST /api/orders
// @access  Private (customer)
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, stripePaymentIntentId, affiliateCode, giftCardCode } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No order items provided");
  }

  if (stripePaymentIntentId) {
    const existing = await Order.findOne({ stripePaymentIntentId });
    if (existing) {
      return res.status(200).json({ success: true, order: existing });
    }
  }

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

  let giftCard = null;
  let giftCardApplied = 0;

  if (giftCardCode) {
    const preview = await previewGiftCard(giftCardCode, total);
    if (!preview) {
      res.status(400);
      throw new Error("This gift card code is invalid or can't be used.");
    }
    giftCardApplied = preview.applicable;

    const updatedGiftCard = await GiftCard.findOneAndUpdate(
      { _id: preview.giftCard._id, balance: { $gte: giftCardApplied } },
      { $inc: { balance: -giftCardApplied } },
      { new: true }
    );

    if (!updatedGiftCard) {
      res.status(409);
      throw new Error("This gift card was just used elsewhere. Please refresh and try again.");
    }

    if (updatedGiftCard.balance <= 0 && updatedGiftCard.status === "active") {
      updatedGiftCard.status = "depleted";
      await updatedGiftCard.save();
    }

    giftCard = updatedGiftCard;
  }

  const remaining = Number((total - giftCardApplied).toFixed(2));

  const rollbackGiftCard = async () => {
    if (!giftCard || giftCardApplied <= 0) return;
    try {
      await GiftCard.findByIdAndUpdate(giftCard._id, {
        $inc: { balance: giftCardApplied },
        $set: { status: "active" },
      });
    } catch (err) {
      console.error(`[gift card rollback] failed for code ${giftCardCode}: ${err.message}`);
    }
  };

  let paymentStatus = "pending";

  if (remaining <= 0) {
    paymentStatus = "paid";
  } else if (stripe) {
    if (!stripePaymentIntentId) {
      await rollbackGiftCard();
      res.status(402);
      throw new Error("Payment is required to place this order");
    }

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
    } catch (err) {
      await rollbackGiftCard();
      throw err;
    }

    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      await rollbackGiftCard();
      res.status(402);
      throw new Error("Payment has not been completed successfully");
    }

    const expectedCents = Math.round(remaining * 100);
    if (paymentIntent.amount !== expectedCents) {
      await rollbackGiftCard();
      res.status(402);
      throw new Error("Payment amount does not match order total");
    }

    if (paymentIntent.metadata?.userId && paymentIntent.metadata.userId !== req.user._id.toString()) {
      await rollbackGiftCard();
      res.status(403);
      throw new Error("This payment does not belong to the current user");
    }

    paymentStatus = "paid";
  } else {
    console.warn(
      "[orders] STRIPE_SECRET_KEY is not set - orders are being auto-marked as paid without real payment verification. Do not run production traffic in this state."
    );
    paymentStatus = "paid";
  }

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (product.stock < item.quantity) {
      await rollbackGiftCard();
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
    paymentMethod: remaining <= 0 && giftCardApplied > 0 ? "gift_card" : paymentMethod || "stripe",
    paymentStatus,
    stripePaymentIntentId: stripePaymentIntentId || "",
    giftCardCode: giftCard ? giftCard.code : "",
    giftCardAmountApplied: giftCardApplied,
  });

  if (giftCard) {
    try {
      await GiftCard.findByIdAndUpdate(giftCard._id, {
        $push: { redemptions: { order: order._id, amount: giftCardApplied, redeemedBy: req.user._id } },
      });
    } catch (err) {
      console.error(`[gift card audit trail] failed for order ${order.orderNumber}: ${err.message}`);
    }
  }

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
