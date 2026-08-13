const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    images: [{ url: String, publicId: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },
    featured: { type: Boolean, default: false },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // % of sale price paid out to the affiliate who drove the sale
    commissionPercent: { type: Number, default: 20, min: 0, max: 90 },
    sku: { type: String, default: "" },
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    ratingsAverage: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
