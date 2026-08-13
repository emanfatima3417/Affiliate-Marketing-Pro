const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const User = require("../models/User");

// Verifies the JWT (from Authorization header or cookie) and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user || !req.user.isActive) {
      res.status(401);
      throw new Error("Not authorized, user not found or inactive");
    }
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

// Restricts a route to one or more roles: authorize("admin", "seller")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user?.role}' is not allowed to access this resource`);
  }
  next();
};

// Only approved sellers may manage products
const requireApprovedSeller = (req, res, next) => {
  if (req.user.role === "seller" && req.user.status !== "approved") {
    res.status(403);
    throw new Error("Your seller account is not yet approved by admin");
  }
  next();
};

module.exports = { protect, authorize, requireApprovedSeller };
