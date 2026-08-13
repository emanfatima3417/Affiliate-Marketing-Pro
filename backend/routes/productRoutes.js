const express = require("express");
const {
  getProducts,
  getFeaturedProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require("../controllers/productController");
const { protect, authorize, requireApprovedSeller } = require("../middleware/auth");

const router = express.Router();

router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/mine/list", protect, authorize("seller", "admin"), getMyProducts);
router.get("/:idOrSlug", getProduct);

router.post("/", protect, authorize("seller", "admin"), requireApprovedSeller, createProduct);
router.put("/:id", protect, authorize("seller", "admin"), requireApprovedSeller, updateProduct);
router.delete("/:id", protect, authorize("seller", "admin"), deleteProduct);

module.exports = router;
