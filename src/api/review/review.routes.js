const express = require("express");
const { uploadReviewPhoto } = require("../../middlewares/upload.middleware");
const {
  getAllReviews,
  getReviewById,
  createReviewController,
  updateReviewController,
  deleteReviewController,
  getReviewId,
  getFiveStarReview,
  getPharmacyReview,
} = require("./review.controller");

const router = express.Router();

router.get("/", getAllReviews);
router.get("/fivestar", getFiveStarReview); // 리뷰의 별점이 5점인 리뷰만 조회
router.get("/:user_id", getReviewById); // user_id로 리뷰조회
router.get("/:user_id/id", getReviewId); // user_id로 리뷰의 아이디만 조회
router.get("/:pharmacyId/pharmacyReview", getPharmacyReview);

// 리뷰 생성 (with optional photo)
router.post("/", uploadReviewPhoto, createReviewController);

//리뷰 삭제
router.delete("/:review_id/del", deleteReviewController);

//리뷰 업로드
router.put("/:review_id/update", uploadReviewPhoto, updateReviewController);

module.exports = router;
