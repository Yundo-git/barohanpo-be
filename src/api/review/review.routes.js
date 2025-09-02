const express = require("express");
const {
  getAllReviews,
  getReviewById,
  createReviewController,
  updateReviewController,
  deleteReviewController,
  getReviewId,
  getFiveStarReview,
} = require("./review.controller");

const router = express.Router();

router.get("/", getAllReviews);
router.get("/fivestar", getFiveStarReview); // 리뷰의 별점이 5점인 리뷰만 조회
router.get("/:user_id", getReviewById); // user_id로 리뷰조회
router.get("/:user_id/id", getReviewId); // user_id로 리뷰의 아이디만 조회

router.post("/", createReviewController);
router.put("/:user_id", updateReviewController);
router.delete("/:user_id", deleteReviewController);

module.exports = router;
