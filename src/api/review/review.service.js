const { reviewModel } = require("./review.model");
const db = require("../../config/database");

const fetchAll = async () => {
  try {
    const rows = await reviewModel.findAll();
    return rows;
  } catch (error) {
    console.error("Error in reviewService.fetchAll:", error);
    throw error;
  }
};

const fetchById = async (user_id) => {
  try {
    const row = await reviewModel.findById(user_id);
    return row;
  } catch (error) {
    console.error("Error in reviewService.fetchById:", error);
    throw error;
  }
};

const fetchOneId = async (user_id) => {
  try {
    const row = await reviewModel.findOneId(user_id);
    return row;
  } catch (error) {
    console.error("Error in reviewService.fetchOneId:", error);
    throw error;
  }
};
const fetchFiveStarReview = async () => {
  console.log("in service");
  try {
    const rows = await reviewModel.findFiveStarReview();
    return rows;
  } catch (error) {
    console.error("Error in reviewService.fetchFiveStarReview:", error);
    throw error;
  }
};

const fetchPharmacyReview = async (pharmacyId) => {
  try {
    const rows = await reviewModel.findPharmacyReview(pharmacyId);
    return rows;
  } catch (error) {
    console.error("Error in reviewService.fetchPharmacyReview:", error);
    throw error;
  }
};

const createReviewService = async (
  user_id,
  p_id,
  score,
  comment,
  book_id,
  book_date,
  book_time,
  photo_blob = null
) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Create the review first
    const reviewId = await reviewModel.createReview(
      user_id,
      p_id,
      score,
      comment,
      book_id,
      book_date,
      book_time
    );

    // If there's a photo, save it and update the review with the photo ID
    if (photo_blob) {
      await reviewModel.createReviewPhoto(reviewId, photo_blob);
    }

    await connection.commit();
    return { reviewId };
  } catch (error) {
    await connection.rollback();
    console.error("Error in reviewService.createReview:", error);
    throw error;
  } finally {
    connection.release();
  }
};

const updateReviewWithPhotos = async (
  reviewId,
  score,
  comment,
  keepIds = [],
  newPhotoBuffers = []
) => {
  // 최종 개수 검증은 모델에서 실제 존재 개수와 합산해서도 체크하지만,
  // 프리체크로 한 번 더 방어 가능(선택)
  return await reviewModel.updateReviewWithPhotos(
    reviewId,
    score,
    comment,
    keepIds,
    newPhotoBuffers
  );
};
const deleteReview = async (review_id) => {
  try {
    const result = await reviewModel.deleteReview(review_id);
    return result;
  } catch (error) {
    console.error("Error in reviewService.deleteReview:", error);
    throw error;
  }
};

// Get all photos for a review
const getReviewPhotos = async (review_id) => {
  try {
    const photos = await reviewModel.getReviewPhotos(review_id);
    return photos;
  } catch (error) {
    console.error("Error in reviewService.getReviewPhotos:", error);
    throw error;
  }
};

// Add a photo to a review
const addReviewPhoto = async (review_id, photo_blob) => {
  try {
    const photoId = await reviewModel.addReviewPhoto(review_id, photo_blob);
    return photoId;
  } catch (error) {
    console.error("Error in reviewService.addReviewPhoto:", error);
    throw error;
  }
};

// Delete a photo from a review
const deleteReviewPhoto = async (photo_id) => {
  try {
    const result = await reviewModel.deleteReviewPhoto(photo_id);
    return result;
  } catch (error) {
    console.error("Error in reviewService.deleteReviewPhoto:", error);
    throw error;
  }
};

module.exports = {
  fetchAll,
  fetchById,
  fetchOneId,
  fetchFiveStarReview,
  fetchPharmacyReview,
  createReviewService,
  updateReviewWithPhotos,
  deleteReview,
  getReviewPhotos,
  addReviewPhoto,
  deleteReviewPhoto,
};
