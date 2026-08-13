const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["admin", "seller", "affiliate", "customer"],
      default: "customer",
    },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    // Sellers require admin approval before they can list products
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: function () {
        return this.role === "seller" ? "pending" : "approved";
      },
    },
    storeName: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    // Only a hash of the reset token is ever stored - if the database leaks,
    // the hash alone can't be used to reset anyone's password.
    resetPasswordTokenHash: { type: String, select: false, default: undefined },
    resetPasswordExpires: { type: Date, select: false, default: undefined },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordTokenHash;
  delete obj.resetPasswordExpires;
  return obj;
};

// Generates a random reset token, stores only its SHA-256 hash + a 30-minute
// expiry on the user document, and returns the RAW token (only this one time)
// so the caller can email it to the user - it's never persisted in plain form.
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return rawToken;
};

module.exports = mongoose.model("User", userSchema);
