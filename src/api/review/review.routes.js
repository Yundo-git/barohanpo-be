const express = require("express");
const { uploadReviewPhoto, uploadMultipleReviewPhotos } = require("../../middlewares/upload.middleware");
const {
  getAllReviews,
  getReviewById,
  createReviewController,
  updateReviewController,
  deleteReviewController,
  getReviewId,
  getFiveStarReview,
  getPharmacyReview,
  getReviewPhotosController,
  addReviewPhotoController,
  deleteReviewPhotoController
} = require("./review.controller");

const router = express.Router();

// Review routes
router.get("/", getAllReviews);
router.get("/fivestar", getFiveStarReview); // Get reviews with 5 stars
router.get("/:user_id", getReviewById); // Get reviews by user_id
router.get("/:user_id/id", getReviewId); // Get review ID by user_id
router.get("/:pharmacyId/pharmacyReview", getPharmacyReview);

// Create review (with optional photo)
router.post("/", uploadReviewPhoto, createReviewController);

// Delete review
router.delete("/:review_id/del", deleteReviewController);

// Update review (with optional photos)
router.put("/:review_id/update", uploadMultipleReviewPhotos, updateReviewController);

// Review photo routes
router.get("/:review_id/photos", getReviewPhotosController); // Get all photos for a review
router.post("/:review_id/photos", uploadReviewPhoto, addReviewPhotoController); // Add a photo to a review
router.delete("/photos/:photo_id", deleteReviewPhotoController); // Delete a photo from a review

module.exports = router;
