const express = require("express");
const {
  getAllReviews,
  getReviewById,
  createReviewController,
  updateReviewController,
  deleteReviewController,
} = require("./review.controller");

const router = express.Router();

router.get("/", getAllReviews);
router.get("/:user_id", getReviewById);
router.post("/", createReviewController);
router.put("/:user_id", updateReviewController);
router.delete("/:user_id", deleteReviewController);

module.exports = router;
