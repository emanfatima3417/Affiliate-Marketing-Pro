const express = require("express");
const {
  createGiftCard,
  getGiftCards,
  disableGiftCard,
  validateGiftCard,
} = require("../controllers/giftCardController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/validate", protect, validateGiftCard);
router.post("/", protect, authorize("admin"), createGiftCard);
router.get("/", protect, authorize("admin"), getGiftCards);
router.put("/:id/disable", protect, authorize("admin"), disableGiftCard);

module.exports = router;
