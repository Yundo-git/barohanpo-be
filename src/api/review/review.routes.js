const express = require("express");
const { getAllReviews, getReviewById, createReviewController, updateReviewController, deleteReviewController } = require("./review.controller");

const router = express.Router();

router.get("/", getAllReviews);
router.get("/:id", getReviewById);
router.post("/", createReviewController);
router.put("/:id", updateReviewController);
router.delete("/:id", deleteReviewController);

module.exports = router;
