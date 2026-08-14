const asyncHandler = require("../middleware/asyncHandler");
const crypto = require("crypto");
const User = require("../models/User");
const Affiliate = require("../models/Affiliate");
const generateToken = require("../utils/generateToken");
const { sendEmail } = require("../config/email");
const { verifyRecaptcha } = require("../config/recaptcha");
const { nanoid } = require("nanoid");

// @desc    Register a new user (customer, seller, or affiliate)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, storeName, recaptchaToken } = req.body;

  // Honeypot: a hidden field real users never see or fill in. Bots that
  // blindly fill every form field trip this and get a generic rejection -
  // cheap, invisible to real users, no third-party service required.
  if (req.body.companyWebsite) {
    res.status(400);
    throw new Error("Registration could not be completed");
  }

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email and password");
  }

  const isHuman = await verifyRecaptcha(recaptchaToken);
  if (!isHuman) {
    res.status(400);
    throw new Error("We couldn't verify you're not a robot. Please try again.");
  }

  const allowedRoles = ["customer", "seller", "affiliate"]; // admin is never self-registered
  const finalRole = allowedRoles.includes(role) ? role : "customer";

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: finalRole,
    storeName: finalRole === "seller" ? storeName || `${name}'s Store` : "",
  });

  // Automatically provision an affiliate profile with a unique code
  if (finalRole === "affiliate") {
    await Affiliate.create({
      user: user._id,
      code: `AF-${nanoid(8).toUpperCase()}`,
    });
  }

  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated. Contact support.");
  }

  const token = generateToken(user._id, user.role);

  res.json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  let affiliateProfile = null;
  if (req.user.role === "affiliate") {
    affiliateProfile = await Affiliate.findOne({ user: req.user._id });
  }
  res.json({ success: true, user: req.user.toSafeObject(), affiliateProfile });
});

// @desc    Update own profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const fields = ["name", "phone", "avatar", "storeName"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) req.user[f] = req.body[f];
  });

  if (req.body.password) {
    if (!req.body.currentPassword) {
      res.status(400);
      throw new Error("Current password is required to set a new password");
    }

    const userWithPassword = await User.findById(req.user._id).select("+password");
    const matches = await userWithPassword.matchPassword(req.body.currentPassword);
    if (!matches) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }

    req.user.password = req.body.password;
  }

  const updated = await req.user.save();
  res.json({ success: true, user: updated.toSafeObject() });
});

// @desc    Request a password reset email. Always responds the same way
//          whether or not the email exists, so this endpoint can't be used
//          to enumerate which addresses have accounts.
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Please provide an email address");
  }

  const genericResponse = {
    success: true,
    message: "If an account exists for that email, a password reset link has been sent.",
  };

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Same response as the success case - don't reveal whether the email is registered
    return res.json(genericResponse);
  }

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your Affiliate Marketplace Pro password",
      html: `
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password. This link expires in 30 minutes:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
      text: `Reset your password: ${resetUrl} (expires in 30 minutes)`,
    });
  } catch (err) {
    // Email delivery failing shouldn't leak whether the account exists, and
    // shouldn't leave a dangling reset token active if the user never
    // receives it - roll it back and surface a generic server error.
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error(`[forgotPassword] failed to send email: ${err.message}`);
    res.status(500);
    throw new Error("Could not send password reset email. Please try again shortly.");
  }

  res.json(genericResponse);
});

// @desc    Reset password using the token emailed by forgotPassword
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password || password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordTokenHash +resetPasswordExpires");

  if (!user) {
    res.status(400);
    throw new Error("This reset link is invalid or has expired. Please request a new one.");
  }

  user.password = password;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const authToken = generateToken(user._id, user.role);

  res.json({
    success: true,
    message: "Password updated successfully.",
    token: authToken,
    user: user.toSafeObject(),
  });
});

module.exports = { registerUser, loginUser, getMe, updateMe, forgotPassword, resetPassword };
