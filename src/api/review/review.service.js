import reviewModel from "./review.model.js";
import { db } from "../../config/database.js";
const { pool } = db;

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
  photoUrls = []
) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const reviewId = await reviewModel.createReview(
      connection,
      user_id,
      p_id,
      score,
      comment,
      book_id,
      book_date,
      book_time
    );

    if (photoUrls && photoUrls.length > 0) {
      await reviewModel.createReviewPhotos(connection, reviewId, photoUrls);
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
  newPhotoUrls = []
) => {
  return await reviewModel.updateReviewWithPhotos(
    reviewId,
    score,
    comment,
    keepIds,
    newPhotoUrls
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

const getReviewPhotos = async (review_id) => {
  try {
    const photos = await reviewModel.getReviewPhotos(review_id);
    return photos;
  } catch (error) {
    console.error("Error in reviewService.getReviewPhotos:", error);
    throw error;
  }
};

const getReviewPhotoUrlById = async (photo_id) => {
  try {
    const photo = await reviewModel.getReviewPhotoUrlById(photo_id);
    return photo ? photo.review_photo_url : null;
  } catch (error) {
    console.error("Error in reviewService.getReviewPhotoUrlById:", error);
    throw error;
  }
};

const addReviewPhoto = async (review_id, photo_url) => {
  try {
    const photoId = await reviewModel.addReviewPhoto(review_id, photo_url);
    return photoId;
  } catch (error) {
    console.error("Error in reviewService.addReviewPhoto:", error);
    throw error;
  }
};

const deleteReviewPhoto = async (photo_id) => {
  try {
    const result = await reviewModel.deleteReviewPhoto(photo_id);
    return result;
  } catch (error) {
    console.error("Error in reviewService.deleteReviewPhoto:", error);
    throw error;
  }
};

export {
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
  getReviewPhotoUrlById,
};
