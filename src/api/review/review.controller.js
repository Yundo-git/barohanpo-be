const { fetchAll, fetchById, createReview, updateReview, deleteReview } = require("./review.service");

//모든 리뷰 내용 조회
const getAllReviews = async (req, res) => {
    try {
        const rows = await fetchAll();
        res.json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Error in reviewController.getAllReviews:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

//특정 회원의 리뷰 내역 조회
const getReviewById = async (req, res) => {
    const { id } = req.params;
    try {
        const row = await fetchById(id);
        res.json({ success: true, data: row });
    } catch (error) {
        console.error("Error in reviewController.getReviewById:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

//리뷰 생성
const createReviewController = async (req, res) => {
    const { user_id, p_id, review, rating } = req.body;
    try {
        const result = await createReview(user_id, p_id, review, rating);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error("Error in reviewController.createReview:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

//리뷰 수정
const updateReviewController = async (req, res) => {
    const { id } = req.params;
    const { review, rating } = req.body;
    try {
        const result = await updateReview(id, review, rating);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error("Error in reviewController.updateReview:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

//리뷰 삭제
const deleteReviewController = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await deleteReview(id);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error("Error in reviewController.deleteReview:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllReviews,
    getReviewById,
    createReviewController,
    updateReviewController,
    deleteReviewController
  };
  