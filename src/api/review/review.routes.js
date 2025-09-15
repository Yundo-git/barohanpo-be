// src/api/review/review.routes.js

import { Router } from "express";
import {
  uploadReviewPhotoSingle,
  uploadReviewPhotos,
} from "../../middlewares/upload.middleware.js";

import {
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
} from "./review.controller.js";

const router = Router();

// 조회
router.get("/", getAllReviews);
router.get("/fivestar", getFiveStarReview);
router.get("/:pharmacyId/pharmacyReview", getPharmacyReview);
router.get("/:user_id/id", getReviewId);
router.get("/:user_id", getReviewById);

// 생성
router.post("/", uploadReviewPhotos, createReviewController);

// 수정
router.put("/:review_id/update", uploadReviewPhotos, updateReviewController);

// 사진 전용
router.get("/:review_id/photos", getReviewPhotosController);
router.post(
  "/:review_id/photos",
  uploadReviewPhotoSingle,
  addReviewPhotoController
);
router.delete("/photos/:photo_id", deleteReviewPhotoController);
router.delete("/:review_id/del", deleteReviewController);

export default router;