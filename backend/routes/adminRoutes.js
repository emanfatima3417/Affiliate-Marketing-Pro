const express = require("express");
const {
  getAdminDashboard,
  getUsers,
  updateSellerStatus,
  toggleUserActive,
  updateProductCommission,
  getAllTransactions,
  getAllAffiliates,
  payoutAffiliate,
  getAllOrders,
  getInventoryOverview,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", getAdminDashboard);
router.get("/users", getUsers);
router.put("/users/:id/seller-status", updateSellerStatus);
router.put("/users/:id/active", toggleUserActive);
router.put("/products/:id/commission", updateProductCommission);
router.get("/transactions", getAllTransactions);
router.get("/affiliates", getAllAffiliates);
router.post("/affiliates/:id/payout", payoutAffiliate);
router.get("/orders", getAllOrders);
router.get("/inventory", getInventoryOverview);

module.exports = router;
