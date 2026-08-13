const express = require("express");
const {
  joinAffiliateProgram,
  getMyAffiliateProfile,
  getAffiliateLink,
  trackClick,
  getPromotableProducts,
  getMyCommissions,
  getAffiliateAnalytics,
} = require("../controllers/affiliateController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/join", protect, joinAffiliateProgram);
router.post("/track-click", trackClick); // public - fires from product pages
router.get("/me", protect, authorize("affiliate", "admin"), getMyAffiliateProfile);
router.get("/link/:productId", protect, authorize("affiliate", "admin"), getAffiliateLink);
router.get("/products", protect, authorize("affiliate", "admin"), getPromotableProducts);
router.get("/commissions", protect, authorize("affiliate", "admin"), getMyCommissions);
router.get("/analytics", protect, authorize("affiliate", "admin"), getAffiliateAnalytics);

module.exports = router;
