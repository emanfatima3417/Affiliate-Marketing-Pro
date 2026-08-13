const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Commission = require("../models/Commission");
const Affiliate = require("../models/Affiliate");
const Transaction = require("../models/Transaction");
const { sendEmail } = require("../config/email");
const { sellerStatusEmail, payoutProcessedEmail } = require("../utils/emailTemplates");

// @desc    Admin dashboard summary
// @route   GET /api/admin/dashboard
// @access  Private (admin)
const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalSellers,
    totalAffiliates,
    totalCustomers,
    pendingSellers,
    totalProducts,
    totalOrders,
    revenueAgg,
    commissionAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "seller" }),
    User.countDocuments({ role: "affiliate" }),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "seller", status: "pending" }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
    Commission.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
  ]);

  const salesByDay = await Order.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  const topProducts = await Product.find().sort("-totalSales").limit(5).select("title totalSales totalRevenue");

  const lowStock = await Product.find({ stock: { $lte: 100 }, status: "active" })
    .sort("stock")
    .limit(10)
    .select("title stock price");

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalSellers,
      totalAffiliates,
      totalCustomers,
      pendingSellers,
      totalProducts,
      totalOrders,
      totalRevenue: Number((revenueAgg[0]?.total || 0).toFixed(2)),
      totalCommissions: Number((commissionAgg[0]?.total || 0).toFixed(2)),
    },
    salesByDay,
    topProducts,
    lowStock,
  });
});

// @desc    List users (filter by role/status)
// @route   GET /api/admin/users
// @access  Private (admin)
const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  const users = await User.find(filter).sort("-createdAt");
  res.json({ success: true, users });
});

// @desc    Approve or reject a pending seller
// @route   PUT /api/admin/users/:id/seller-status
// @access  Private (admin)
const updateSellerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // approved | rejected | suspended
  const user = await User.findById(req.params.id);
  if (!user || user.role !== "seller") {
    res.status(404);
    throw new Error("Seller not found");
  }
  user.status = status;
  await user.save();

  // Only email on the two decisions the applicant is actively waiting on -
  // not every possible status transition (e.g. a later "suspended").
  if (status === "approved" || status === "rejected") {
    try {
      const { subject, html, text } = sellerStatusEmail(user, status);
      await sendEmail({ to: user.email, subject, html, text });
    } catch (err) {
      console.error(`[seller status email] failed for ${user.email}: ${err.message}`);
    }
  }

  res.json({ success: true, user: user.toSafeObject() });
});

// @desc    Toggle a user's active state (suspend/reactivate any account)
// @route   PUT /api/admin/users/:id/active
// @access  Private (admin)
const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.isActive = req.body.isActive;
  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

// @desc    Update global/product commission default settings
// @route   PUT /api/admin/products/:id/commission
// @access  Private (admin)
const updateProductCommission = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  product.commissionPercent = req.body.commissionPercent;
  await product.save();
  res.json({ success: true, product });
});

// @desc    Process a payout for an affiliate's current balance. Marks all
//          their outstanding commissions paid, zeroes their balance, and
//          records a payout transaction. This is a manual action taken by
//          an admin - it does not move real money on its own (no payment
//          provider payout API is wired up), it records that the payout
//          happened outside the system (bank transfer, PayPal, etc.) so the
//          ledger stays accurate.
// @route   POST /api/admin/affiliates/:id/payout
// @access  Private (admin)
const payoutAffiliate = asyncHandler(async (req, res) => {
  const affiliate = await Affiliate.findById(req.params.id).populate("user", "name email");
  if (!affiliate) {
    res.status(404);
    throw new Error("Affiliate not found");
  }

  const amount = Number(affiliate.balance.toFixed(2));
  if (amount <= 0) {
    res.status(400);
    throw new Error("This affiliate has no outstanding balance to pay out");
  }

  await Commission.updateMany(
    { affiliate: affiliate._id, status: { $ne: "paid" } },
    { $set: { status: "paid" } }
  );

  affiliate.totalPaid = Number((affiliate.totalPaid + amount).toFixed(2));
  affiliate.balance = 0;
  await affiliate.save();

  const transaction = await Transaction.create({
    user: affiliate.user._id,
    type: "payout",
    amount,
    status: "completed",
    reference: `PAYOUT-${affiliate.code}-${Date.now()}`,
    notes: "Manual payout processed by admin",
  });

  try {
    const { subject, html, text } = payoutProcessedEmail(affiliate.user, amount);
    await sendEmail({ to: affiliate.user.email, subject, html, text });
  } catch (err) {
    console.error(`[payout email] failed for ${affiliate.user.email}: ${err.message}`);
  }

  res.json({ success: true, affiliate, transaction });
});

// @desc    View all transactions (platform-wide ledger)
// @route   GET /api/admin/transactions
// @access  Private (admin)
const getAllTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find()
    .populate("user", "name email role")
    .populate("order", "orderNumber")
    .sort("-createdAt")
    .limit(500);
  res.json({ success: true, transactions });
});

// @desc    View all affiliate performance
// @route   GET /api/admin/affiliates
// @access  Private (admin)
const getAllAffiliates = asyncHandler(async (req, res) => {
  const affiliates = await Affiliate.find().populate("user", "name email").sort("-totalEarnings");
  res.json({ success: true, affiliates });
});

// @desc    All orders (admin)
// @route   GET /api/admin/orders
// @access  Private (admin)
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate("customer", "name email").sort("-createdAt").limit(200);
  res.json({ success: true, orders });
});

// @desc    Inventory overview across all sellers
// @route   GET /api/admin/inventory
// @access  Private (admin)
const getInventoryOverview = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate("seller", "name storeName")
    .select("title stock price status seller totalSales commissionPercent")
    .sort("stock");
  res.json({ success: true, products });
});

module.exports = {
  getAdminDashboard,
  getUsers,
  updateSellerStatus,
  toggleUserActive,
  updateProductCommission,
  getAllTransactions,
  getAllAffiliates,
  payoutAffiliate,
  getAllOrders,
  getInventoryOverview,
};
