const mongoose = require("mongoose");

const redemptionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    amount: { type: Number, required: true },
    redeemedAt: { type: Date, default: Date.now },
    redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const giftCardSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    initialBalance: { type: Number, required: true, min: 0.01 },
    balance: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "depleted", "disabled", "expired"],
      default: "active",
    },
    expiresAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String, default: "" },
    redemptions: [redemptionSchema],
  },
  { timestamps: true }
);

giftCardSchema.methods.isUsable = function () {
  if (this.status !== "active") return false;
  if (this.balance <= 0) return false;
  if (this.expiresAt && this.expiresAt.getTime() < Date.now()) return false;
  return true;
};

module.exports = mongoose.model("GiftCard", giftCardSchema);
