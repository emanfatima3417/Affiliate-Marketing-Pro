const asyncHandler = require("../middleware/asyncHandler");
const cloudinary = require("../config/cloudinary");

// Streams an in-memory multer file buffer up to Cloudinary
const streamUpload = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    stream.end(buffer);
  });

// @desc    Upload one or more product images
// @route   POST /api/upload
// @access  Private (seller, admin)
const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("No files uploaded");
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name") {
    res.status(500);
    throw new Error("Cloudinary is not configured on the server yet. Set CLOUDINARY_* env vars.");
  }

  const uploads = await Promise.all(
    req.files.map((file) => streamUpload(file.buffer, "affiliate-marketplace-pro/products"))
  );

  const images = uploads.map((u) => ({ url: u.secure_url, publicId: u.public_id }));
  res.status(201).json({ success: true, images });
});

module.exports = { uploadImages };
