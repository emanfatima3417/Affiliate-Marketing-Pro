const express = require("express");
const { getSellerDashboard, getSellerAffiliateSales } = require("../controllers/sellerController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", protect, authorize("seller", "admin"), getSellerDashboard);
router.get("/affiliate-sales", protect, authorize("seller", "admin"), getSellerAffiliateSales);

module.exports = router;
