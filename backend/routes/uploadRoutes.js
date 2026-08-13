const express = require("express");
const { uploadImages } = require("../controllers/uploadController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/", protect, authorize("seller", "admin"), upload.array("images", 6), uploadImages);

module.exports = router;
