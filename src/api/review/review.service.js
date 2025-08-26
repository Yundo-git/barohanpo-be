
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

const fetchById = async (id) => {
    try {
        const row = await reviewModel.findById(id);
        return row;
    } catch (error) {
        console.error("Error in reviewService.fetchById:", error);
        throw error;
    }
};

const createReview = async (user_id, p_id, review, rating) => {
    try {
        const result = await reviewModel.createReview(user_id, p_id, review, rating);
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
    createReview,
    updateReview,
    deleteReview
};
