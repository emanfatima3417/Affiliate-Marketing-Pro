const asyncHandler = require("../middleware/asyncHandler");
const Affiliate = require("../models/Affiliate");
const Click = require("../models/Click");
const Commission = require("../models/Commission");
const Product = require("../models/Product");
const { nanoid } = require("nanoid");

// @desc    Become an affiliate (upgrade role / create affiliate profile)
// @route   POST /api/affiliates/join
// @access  Private
const joinAffiliateProgram = asyncHandler(async (req, res) => {
  let affiliate = await Affiliate.findOne({ user: req.user._id });
  if (affiliate) {
    res.status(400);
    throw new Error("You are already registered as an affiliate");
  }

  affiliate = await Affiliate.create({
    user: req.user._id,
    code: `AF-${nanoid(8).toUpperCase()}`,
  });

  if (req.user.role !== "affiliate" && req.user.role !== "admin") {
    req.user.role = "affiliate";
    await req.user.save();
  }

  res.status(201).json({ success: true, affiliate });
});

// @desc    Get my affiliate profile + stats
// @route   GET /api/affiliates/me
// @access  Private (affiliate)
const getMyAffiliateProfile = asyncHandler(async (req, res) => {
  const affiliate = await Affiliate.findOne({ user: req.user._id });
  if (!affiliate) {
    res.status(404);
    throw new Error("Affiliate profile not found. Join the affiliate program first.");
  }
  res.json({ success: true, affiliate });
});

// @desc    Generate/get a trackable affiliate link for a specific product
// @route   GET /api/affiliates/link/:productId
// @access  Private (affiliate)
const getAffiliateLink = asyncHandler(async (req, res) => {
  const affiliate = await Affiliate.findOne({ user: req.user._id });
  if (!affiliate) {
    res.status(404);
    throw new Error("Affiliate profile not found. Join the affiliate program first.");
  }

  const product = await Product.findById(req.params.productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const link = `${baseUrl}/products/${product.slug}?ref=${affiliate.code}`;

  res.json({ success: true, link, code: affiliate.code, product: { id: product._id, title: product.title } });
});

// @desc    Log a click when someone visits a product page via an affiliate link
// @route   POST /api/affiliates/track-click
// @access  Public
const trackClick = asyncHandler(async (req, res) => {
  const { code, productId } = req.body;
  if (!code || !productId) {
    res.status(400);
    throw new Error("code and productId are required");
  }

  const affiliate = await Affiliate.findOne({ code });
  if (!affiliate) {
    return res.json({ success: true, tracked: false }); // fail silently for invalid codes
  }

  await Click.create({
    affiliate: affiliate._id,
    product: productId,
    ip: req.ip,
    userAgent: req.headers["user-agent"] || "",
    referrer: req.headers["referer"] || "",
  });

  affiliate.totalClicks += 1;
  await affiliate.save();

  res.json({ success: true, tracked: true });
});

// @desc    Get list of products available to promote (active products with commission info)
// @route   GET /api/affiliates/products
// @access  Private (affiliate)
const getPromotableProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: "active" })
    .select("title slug price images commissionPercent stock category")
    .populate("category", "name");
  res.json({ success: true, products });
});

// @desc    Get my commissions (list)
// @route   GET /api/affiliates/commissions
// @access  Private (affiliate)
const getMyCommissions = asyncHandler(async (req, res) => {
  const affiliate = await Affiliate.findOne({ user: req.user._id });
  if (!affiliate) {
    res.status(404);
    throw new Error("Affiliate profile not found");
  }
  const commissions = await Commission.find({ affiliate: affiliate._id })
    .populate("product", "title images")
    .populate("order", "orderNumber createdAt")
    .sort("-createdAt");

  res.json({ success: true, commissions });
});

// @desc    Get click analytics (clicks over time, conversion rate)
// @route   GET /api/affiliates/analytics
// @access  Private (affiliate)
const getAffiliateAnalytics = asyncHandler(async (req, res) => {
  const affiliate = await Affiliate.findOne({ user: req.user._id });
  if (!affiliate) {
    res.status(404);
    throw new Error("Affiliate profile not found");
  }

  const clicksByDay = await Click.aggregate([
    { $match: { affiliate: affiliate._id } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        clicks: { $sum: 1 },
        conversions: { $sum: { $cond: ["$converted", 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topProducts = await Click.aggregate([
    { $match: { affiliate: affiliate._id } },
    { $group: { _id: "$product", clicks: { $sum: 1 } } },
    { $sort: { clicks: -1 } },
    { $limit: 5 },
    {
      $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" },
    },
    { $unwind: "$product" },
    { $project: { clicks: 1, title: "$product.title" } },
  ]);

  res.json({
    success: true,
    affiliate,
    clicksByDay,
    topProducts,
  });
});

module.exports = {
  joinAffiliateProgram,
  getMyAffiliateProfile,
  getAffiliateLink,
  trackClick,
  getPromotableProducts,
  getMyCommissions,
  getAffiliateAnalytics,
};
