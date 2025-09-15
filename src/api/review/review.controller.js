// src/api/review/review.controller.js

import {
  fetchAll,
  fetchById,
  fetchOneId,
  fetchFiveStarReview,
  fetchPharmacyReview,
  createReviewService,
  updateReviewWithPhotos,
  deleteReview,
  getReviewPhotos, // 기존 사진 URL을 가져오기 위해 import 추가
  getReviewPhotoUrlById,
  addReviewPhoto,
  deleteReviewPhoto,
} from "./review.service.js";

import { put, del } from "@vercel/blob";
import { logger } from "../../utils/logger.js"; // 로그 추가

// 모든 리뷰 내용 조회
const getAllReviews = async (req, res) => {
  try {
    const rows = await fetchAll();
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    logger.error("Error in reviewController.getAllReviews:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 특정 회원의 리뷰 내역 조회
const getReviewById = async (req, res) => {
  const { user_id } = req.params;
  try {
    const row = await fetchById(user_id);
    res.json({ success: true, data: row });
  } catch (error) {
    logger.error("Error in reviewController.getReviewById:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 특정회원의 작성된 리뷰의 아이디만 조회
const getReviewId = async (req, res) => {
  const { user_id } = req.params;
  try {
    const row = await fetchOneId(user_id);
    res.json({ success: true, data: row });
  } catch (error) {
    logger.error("Error in reviewController.getReviewId:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 별점이 5점인 리뷰 조회
const getFiveStarReview = async (req, res) => {
  try {
    const rows = await fetchFiveStarReview();
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    logger.error("Error in reviewController.getFiveStarReview:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// pharmacyId로 리뷰 조회
const getPharmacyReview = async (req, res) => {
  const { pharmacyId } = req.params;
  try {
    const rows = await fetchPharmacyReview(pharmacyId);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    logger.error("Error in reviewController.getPharmacyReview:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 리뷰 생성
const createReviewController = async (req, res) => {
  const { user_id, book_id, p_id, score, comment, book_date, book_time } = req.body;
  
  const photoUrls = req.uploadedUrls || [];

  try {
    const result = await createReviewService(
      user_id,
      p_id,
      score,
      comment,
      book_id,
      book_date,
      book_time,
      photoUrls
    );

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error in reviewController.createReview:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create review",
    });
  }
};

// 특정 리뷰 사진 조회
const getReviewPhotosController = async (req, res) => {
  const { review_id } = req.params;

  try {
    const photos = await getReviewPhotos(review_id);
    res.json({
      success: true,
      data: photos,
    });
  } catch (error) {
    logger.error("Error in reviewController.getReviewPhotos:", error);
    res.status(500).json({
      success: false,
      error: error.message || "리뷰 사진을 불러오는 중 오류가 발생했습니다.",
    });
  }
};

// 리뷰 사진 추가 (개별)
const addReviewPhotoController = async (req, res) => {
  const { review_id } = req.params;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "사진 파일이 필요합니다.",
      });
    }

    const file = req.file;
    const fileName = `review_photos/${Date.now()}_${file.originalname}`;
    const blob = await put(fileName, file.buffer, {
      access: "public",
    });

    const photoId = await addReviewPhoto(review_id, blob.url);

    res.status(201).json({
      success: true,
      photo_id: photoId,
      message: "리뷰 사진이 추가되었습니다.",
    });
  } catch (error) {
    logger.error("Error in reviewController.addReviewPhoto:", error);
    res.status(500).json({
      success: false,
      error: error.message || "리뷰 사진 추가 중 오류가 발생했습니다.",
    });
  }
};

// 리뷰 사진 삭제 (개별)
const deleteReviewPhotoController = async (req, res) => {
  const { photo_id } = req.params;

  try {
    const url = await getReviewPhotoUrlById(photo_id);
    if (url) {
      // Vercel Blob에서 사진 삭제
      await del(url);
    }

    // DB에서 사진 정보 삭제
    await deleteReviewPhoto(photo_id);
    res.json({
      success: true,
      message: "리뷰 사진이 삭제되었습니다.",
    });
  } catch (error) {
    logger.error("Error in reviewController.deleteReviewPhoto:", error);
    res.status(500).json({
      success: false,
      error: error.message || "리뷰 사진 삭제 중 오류가 발생했습니다.",
    });
  }
};

// 리뷰 수정
const updateReviewController = async (req, res) => {
  const { review_id } = req.params;
  const { score, comment, existing_photo_ids } = req.body;
  
  const newPhotoUrls = req.uploadedUrls || [];
  
  let keepIds = [];
  if (existing_photo_ids) {
    try {
      const parsed = JSON.parse(existing_photo_ids);
      if (Array.isArray(parsed)) {
        keepIds = parsed.map(v => Number(v)).filter(n => Number.isFinite(n) && n > 0);
      }
    } catch (e) {
      return res.status(400).json({ success: false, message: "existing_photo_ids 파싱 실패" });
    }
  }

  try {
    // 1. DB에서 현재 리뷰와 연결된 모든 사진 URL을 가져옵니다.
    const currentPhotos = await getReviewPhotos(Number(review_id));
    
    // 2. 삭제할 사진 ID 목록을 만듭니다.
    const photosToDelete = currentPhotos.filter(photo => !keepIds.includes(photo.review_photo_id));
    
    // 3. Vercel Blob에서 사진들을 삭제합니다.
    if (photosToDelete.length > 0) {
      const deletePromises = photosToDelete.map(photo => del(photo.review_photo_url).catch(e => {
        logger.error(`Failed to delete blob for URL: ${photo.review_photo_url}`, e);
        return null; // 실패해도 Promise.all이 멈추지 않도록 null 반환
      }));
      await Promise.all(deletePromises);
    }
    
    // 4. DB를 업데이트합니다.
    const result = await updateReviewWithPhotos(
      Number(review_id),
      Number(score),
      comment,
      keepIds,
      newPhotoUrls
    );
    
    return res.json({
      success: true,
      message: "리뷰가 성공적으로 수정되었습니다.",
      data: result,
    });
  } catch (error) {
    logger.error("Error in reviewController.updateReview:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "리뷰 수정 중 오류가 발생했습니다.",
    });
  }
};

// 리뷰 삭제
const deleteReviewController = async (req, res) => {
  const { review_id } = req.params; // review_id가 이 줄에서 정의됩니다.
  
  // *** 이 로깅을 아래로 옮겨야 합니다. ***
  logger.info(`삭제 요청 수신: review_id = ${review_id}`); 

  try {
    // 1. DB에서 리뷰에 연결된 모든 사진 URL을 가져옵니다.
    const photosToDelete = await getReviewPhotos(Number(review_id));
    logger.info(`DB에서 조회된 사진 수: ${photosToDelete.length}`);

    // 2. Vercel Blob에서 사진들을 삭제합니다.
    if (photosToDelete.length > 0) {
      const deletePromises = photosToDelete.map(photo => del(photo.review_photo_url).catch(e => {
        logger.error(`Failed to delete blob for URL: ${photo.review_photo_url}`, e);
        return null;
      }));
      await Promise.all(deletePromises);
    }
    
    // 3. DB에서 리뷰를 삭제합니다.
    const result = await deleteReview(review_id);
    logger.info(`리뷰 삭제 결과: ${result}`);
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error("Error in reviewController.deleteReview:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
export {
  getAllReviews,
  getReviewById,
  getReviewId,
  getFiveStarReview,
  getPharmacyReview,
  createReviewController,
  updateReviewController,
  deleteReviewController,
  getReviewPhotosController,
  addReviewPhotoController,
  deleteReviewPhotoController
};