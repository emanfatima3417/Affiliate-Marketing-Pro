const express = require("express");
const rateLimit = require("express-rate-limit");
const { registerUser, loginUser, getMe, updateMe, forgotPassword, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Password reset requests are rate-limited more tightly than the rest of the
// API (see server.js) since this endpoint sends an email on every hit and
// could otherwise be used to spam a user's inbox or probe for valid accounts.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many password reset requests. Please try again later." },
});

// Registration is rate-limited per IP as a first line of defense against
// bulk account creation, on top of the honeypot field and optional
// reCAPTCHA verification in the controller itself.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many accounts created from this location. Please try again later." },
});

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

module.exports = router;
