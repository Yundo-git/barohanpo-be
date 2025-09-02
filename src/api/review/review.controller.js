const {
  fetchAll,
  fetchById,
  fetchOneId,
  createReviewService,
  fetchFiveStarReview,
  updateReview,
  deleteReview,
} = require("./review.service");

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
  const { user_id } = req.params;
  console.log("userid in con >>>>", user_id);
  try {
    const row = await fetchById(user_id);
    res.json({ success: true, data: row });
  } catch (error) {
    console.error("Error in reviewController.getReviewById:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

//특정회원의 작성된 리뷰의 아이디만 조회
const getReviewId = async (req, res) => {
  const { user_id } = req.params;
  console.log("userid in con >>>>", user_id);
  try {
    const row = await fetchOneId(user_id);
    res.json({ success: true, data: row });
  } catch (error) {
    console.error("Error in reviewController.getReviewById:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

//별점이 5점인 리뷰 조회
const getFiveStarReview = async (req, res) => {
  try {
    console.log("in controller");
    const rows = await fetchFiveStarReview();
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("Error in reviewController.getFiveStarReview:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

//리뷰 생성
const createReviewController = async (req, res) => {
  const { user_id, book_id, p_id, score, comment, book_date, book_time } = req.body;
  
  try {
    let photo_blob = null;
    
    // Check if there's an uploaded file (handle both single and multiple file uploads)
    if (req.file) {
      // Handle single file upload
      photo_blob = req.file.buffer;
    } else if (req.files && req.files.length > 0) {
      // Handle multiple files (take the first one)
      photo_blob = req.files[0].buffer;
    }
    
    const result = await createReviewService(
      user_id,
      p_id,
      score,
      comment,
      book_id,
      book_date,
      book_time,
      photo_blob
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Review created successfully',
      data: result 
    });
  } catch (error) {
    console.error("Error in reviewController.createReview:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create review' 
    });
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
  getReviewId,
  getFiveStarReview,
  createReviewController,
  updateReviewController,
  deleteReviewController,
};
