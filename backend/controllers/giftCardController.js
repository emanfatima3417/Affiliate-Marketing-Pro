const asyncHandler = require("../middleware/asyncHandler");
const GiftCard = require("../models/GiftCard");
const { nanoid } = require("nanoid");

// @desc    Issue a new gift card
// @route   POST /api/gift-cards
// @access  Private (admin)
const createGiftCard = asyncHandler(async (req, res) => {
  const { amount, expiresAt, note } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error("A valid amount is required");
  }

  let code;
  for (let attempts = 0; attempts < 5; attempts++) {
    const candidate = `GC-${nanoid(10).toUpperCase()}`;
    const exists = await GiftCard.findOne({ code: candidate });
    if (!exists) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    res.status(500);
    throw new Error("Could not generate a unique gift card code, please try again");
  }

  const giftCard = await GiftCard.create({
    code,
    initialBalance: Number(amount),
    balance: Number(amount),
    expiresAt: expiresAt || null,
    note: note || "",
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, giftCard });
});

// @desc    List all gift cards
// @route   GET /api/gift-cards
// @access  Private (admin)
const getGiftCards = asyncHandler(async (req, res) => {
  const giftCards = await GiftCard.find().populate("createdBy", "name email").sort("-createdAt");
  res.json({ success: true, giftCards });
});

// @desc    Disable a gift card (stop it from being usable, without deleting
//          its history)
// @route   PUT /api/gift-cards/:id/disable
// @access  Private (admin)
const disableGiftCard = asyncHandler(async (req, res) => {
  const giftCard = await GiftCard.findById(req.params.id);
  if (!giftCard) {
    res.status(404);
    throw new Error("Gift card not found");
  }
  giftCard.status = "disabled";
  await giftCard.save();
  res.json({ success: true, giftCard });
});

// @desc    Check whether a code is currently usable, and how much of a given
//          order total it would cover. Read-only - does NOT redeem anything.
//          Used by the checkout page to preview the discount before payment.
// @route   POST /api/gift-cards/validate
// @access  Private
const validateGiftCard = asyncHandler(async (req, res) => {
  const { code, orderTotal } = req.body;

  if (!code) {
    res.status(400);
    throw new Error("A gift card code is required");
  }

  const giftCard = await GiftCard.findOne({ code: code.trim().toUpperCase() });

  if (!giftCard || !giftCard.isUsable()) {
    return res.json({ success: true, valid: false, message: "This gift card code is invalid or can't be used." });
  }

  const total = Number(orderTotal) || 0;
  const applicable = Math.min(giftCard.balance, total);

  res.json({
    success: true,
    valid: true,
    balance: giftCard.balance,
    applicable: Number(applicable.toFixed(2)),
    remaining: Number((total - applicable).toFixed(2)),
  });
});

module.exports = { createGiftCard, getGiftCards, disableGiftCard, validateGiftCard };
