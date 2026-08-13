const mongoose = require("mongoose");

const clickSchema = new mongoose.Schema(
  {
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: "Affiliate", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    referrer: { type: String, default: "" },
    converted: { type: Boolean, default: false },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Click", clickSchema);
