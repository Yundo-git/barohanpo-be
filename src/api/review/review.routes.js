const express = require("express");
const {
  uploadReviewPhotoSingle, // 단일
  uploadReviewPhotos, // 다중(최대 3)
} = require("../../middlewares/upload.middleware");

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
  deleteReviewPhotoController,
} = require("./review.controller");

const router = express.Router();

/**
 * 라우팅 순서: 구체 경로를 파라미터 경로 위에
 */

// 조회
router.get("/", getAllReviews);
router.get("/fivestar", getFiveStarReview);
router.get("/:pharmacyId/pharmacyReview", getPharmacyReview);
router.get("/:user_id/id", getReviewId);
router.get("/:user_id", getReviewById);

// 생성(단일 사진 가능: photo|image|file)
router.post("/", uploadReviewPhotoSingle, createReviewController);

// 수정(다중 사진 최대 3장 + existing_photo_ids)
router.put("/:review_id/update", uploadReviewPhotos, updateReviewController);

// 사진 전용
router.get("/:review_id/photos", getReviewPhotosController);
router.post(
  "/:review_id/photos",
  uploadReviewPhotoSingle,
  addReviewPhotoController
);
router.delete("/photos/:photo_id", deleteReviewPhotoController);

module.exports = router;
