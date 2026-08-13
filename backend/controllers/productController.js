const asyncHandler = require("../middleware/asyncHandler");
const Product = require("../models/Product");
const ApiFeatures = require("../utils/apiFeatures");
const slugify = require("../utils/slugify");
const cloudinary = require("../config/cloudinary");
const { nanoid } = require("nanoid");

// @desc    Get all products (public marketplace listing) - filter/search/paginate
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const baseQuery = Product.find({ status: "active" }).populate("category", "name slug").populate(
    "seller",
    "name storeName"
  );

  const features = new ApiFeatures(baseQuery, req.query)
    .filter()
    .search(["title", "description"])
    .sort()
    .paginate();

  const [products, total] = await Promise.all([
    features.query,
    Product.countDocuments({ status: "active" }),
  ]);

  res.json({
    success: true,
    count: products.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    products,
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: "active", featured: true })
    .limit(8)
    .populate("category", "name slug");
  res.json({ success: true, products });
});

// @desc    Get single product by slug or id
// @route   GET /api/products/:idOrSlug
// @access  Public
const getProduct = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: idOrSlug }
    : { slug: idOrSlug };

  const product = await Product.findOne(query)
    .populate("category", "name slug")
    .populate("seller", "name storeName");

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({ success: true, product });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private (seller, admin)
const createProduct = asyncHandler(async (req, res) => {
  const { title, description, category, price, stock, commissionPercent, featured, sku, images } =
    req.body;

  if (!title || !description || price === undefined || stock === undefined) {
    res.status(400);
    throw new Error("Please provide title, description, price and stock");
  }

  const product = await Product.create({
    title,
    slug: slugify(title, nanoid(6)),
    description,
    category: category || undefined,
    price,
    stock,
    commissionPercent: commissionPercent ?? undefined,
    featured: !!featured && req.user.role === "admin", // only admin can force-feature
    sku,
    images: images || [],
    seller: req.user.role === "admin" && req.body.seller ? req.body.seller : req.user._id,
  });

  res.status(201).json({ success: true, product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (owning seller, admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const isOwner = product.seller.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to update this product");
  }

  const editable = [
    "title",
    "description",
    "category",
    "price",
    "stock",
    "status",
    "commissionPercent",
    "sku",
    "images",
  ];
  editable.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });

  // Only admin can toggle "featured"
  if (req.body.featured !== undefined && req.user.role === "admin") {
    product.featured = req.body.featured;
  }

  if (req.body.title) {
    product.slug = slugify(req.body.title, product._id.toString().slice(-6));
  }

  const updated = await product.save();
  res.json({ success: true, product: updated });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (owning seller, admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const isOwner = product.seller.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete this product");
  }

  for (const img of product.images || []) {
    if (img.publicId) {
      try {
        await cloudinary.uploader.destroy(img.publicId);
      } catch (e) {
        // Non-fatal - continue removing the product record
      }
    }
  }

  await product.deleteOne();
  res.json({ success: true, message: "Product deleted" });
});

// @desc    Get products belonging to logged in seller
// @route   GET /api/products/mine/list
// @access  Private (seller)
const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.user._id }).sort("-createdAt");
  res.json({ success: true, products });
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
};
