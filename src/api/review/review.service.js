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

const updateReview = async (id, review, rating) => {
  try {
    const result = await reviewModel.updateReview(id, review, rating);
    return result;
  } catch (error) {
    console.error("Error in reviewService.updateReview:", error);
    throw error;
  }
};

const deleteReview = async (id) => {
  try {
    const result = await reviewModel.deleteReview(id);
    return result;
  } catch (error) {
    console.error("Error in reviewService.deleteReview:", error);
    throw error;
  }
};

module.exports = {
  fetchAll,
  fetchById,
  fetchOneId,
  createReviewService,
  updateReview,
  deleteReview,
  fetchPharmacyReview,
  fetchFiveStarReview,
};
