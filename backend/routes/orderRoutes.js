const express = require("express");
const {
  createPaymentIntent,
  createOrder,
  getMyOrders,
  getOrder,
  getSellerOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/create-payment-intent", protect, createPaymentIntent);
router.post("/", protect, authorize("customer", "admin"), createOrder);
router.get("/mine", protect, authorize("customer", "admin"), getMyOrders);
router.get("/seller/mine", protect, authorize("seller", "admin"), getSellerOrders);
router.put("/:id/status", protect, authorize("seller", "admin"), updateOrderStatus);
router.get("/:id", protect, getOrder);

module.exports = router;
