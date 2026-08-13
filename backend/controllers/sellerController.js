const asyncHandler = require("../middleware/asyncHandler");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const Commission = require("../models/Commission");

// @desc    Seller dashboard summary (earnings, orders, product counts, affiliate-driven sales)
// @route   GET /api/sellers/dashboard
// @access  Private (seller)
const getSellerDashboard = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const [productCount, activeProductCount, orders] = await Promise.all([
    Product.countDocuments({ seller: sellerId }),
    Product.countDocuments({ seller: sellerId, status: "active" }),
    Order.find({ "items.seller": sellerId }),
  ]);

  let totalRevenue = 0;
  let totalUnitsSold = 0;
  let affiliateDrivenRevenue = 0;
  let affiliateDrivenUnits = 0;

  orders.forEach((order) => {
    order.items
      .filter((i) => i.seller.toString() === sellerId.toString())
      .forEach((item) => {
        const lineTotal = item.price * item.quantity;
        totalRevenue += lineTotal;
        totalUnitsSold += item.quantity;
        if (item.affiliate) {
          affiliateDrivenRevenue += lineTotal;
          affiliateDrivenUnits += item.quantity;
        }
      });
  });

  const totalPaidOut = await Transaction.aggregate([
    { $match: { user: sellerId, type: "sale" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const topProducts = await Product.find({ seller: sellerId })
    .sort("-totalSales")
    .limit(5)
    .select("title totalSales totalRevenue stock");

  res.json({
    success: true,
    stats: {
      productCount,
      activeProductCount,
      orderCount: orders.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalUnitsSold,
      netEarnings: Number((totalPaidOut[0]?.total || 0).toFixed(2)),
      affiliateDrivenRevenue: Number(affiliateDrivenRevenue.toFixed(2)),
      affiliateDrivenUnits,
    },
    topProducts,
  });
});

// @desc    Affiliate-driven sales breakdown for the seller's products
// @route   GET /api/sellers/affiliate-sales
// @access  Private (seller)
const getSellerAffiliateSales = asyncHandler(async (req, res) => {
  const commissions = await Commission.find({ seller: req.user._id })
    .populate("product", "title")
    .populate({ path: "affiliate", populate: { path: "user", select: "name email" } })
    .sort("-createdAt");

  res.json({ success: true, commissions });
});

module.exports = { getSellerDashboard, getSellerAffiliateSales };
