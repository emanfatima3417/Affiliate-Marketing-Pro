const mongoose = require("mongoose");

const affiliateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    code: { type: String, required: true, unique: true }, // unique referral code e.g. "AF-7GQK2P"
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    totalClicks: { type: Number, default: 0 },
    totalConversions: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }, // lifetime commission earned
    totalPaid: { type: Number, default: 0 }, // total paid out to affiliate
    balance: { type: Number, default: 0 }, // unpaid earnings available for payout
    payoutMethod: { type: String, default: "" },
    payoutDetails: { type: String, default: "" },
  },
  { timestamps: true }
);

affiliateSchema.virtual("conversionRate").get(function () {
  if (!this.totalClicks) return 0;
  return Number(((this.totalConversions / this.totalClicks) * 100).toFixed(2));
});

affiliateSchema.set("toJSON", { virtuals: true });
affiliateSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Affiliate", affiliateSchema);
