const { reviewModel } = require("./review.model");

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

const createReviewService = async (
  user_id,
  p_id,
  score,
  comment,
  book_id,
  book_date,
  book_time
) => {
  try {
    const result = await reviewModel.createReview(
      user_id,
      p_id,
      score,
      comment,
      book_id,
      book_date,
      book_time
    );
    return result;
  } catch (error) {
    console.error("Error in reviewService.createReview:", error);
    throw error;
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
  fetchFiveStarReview,
};
