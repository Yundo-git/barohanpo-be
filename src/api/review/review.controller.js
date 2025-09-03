const {
  fetchAll,
  fetchById,
  fetchOneId,
  createReviewService,
  fetchFiveStarReview,
  updateReview,
  fetchPharmacyReview,
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

//pharmacyId로 리뷰 조회
const getPharmacyReview = async (req, res) => {
  const { pharmacyId } = req.params;
  try {
    const rows = await fetchPharmacyReview(pharmacyId);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("Error in reviewController.getPharmacyReview:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

//리뷰 생성
const createReviewController = async (req, res) => {
  const { user_id, book_id, p_id, score, comment, book_date, book_time } =
    req.body;

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
      message: "Review created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in reviewController.createReview:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create review",
    });
  }
};

// Get all photos for a review
const getReviewPhotosController = async (req, res) => {
  const { review_id } = req.params;
  
  try {
    const photos = await getReviewPhotos(review_id);
    res.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error("Error in reviewController.getReviewPhotos:", error);
    res.status(500).json({
      success: false,
      error: error.message || "리뷰 사진을 불러오는 중 오류가 발생했습니다.",
    });
  }
};

// Add a photo to a review
const addReviewPhotoController = async (req, res) => {
  const { review_id } = req.params;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "사진 파일이 필요합니다."
      });
    }
    
    const photoId = await addReviewPhoto(review_id, req.file.buffer);
    
    res.status(201).json({
      success: true,
      photo_id: photoId,
      message: "리뷰 사진이 추가되었습니다."
    });
  } catch (error) {
    console.error("Error in reviewController.addReviewPhoto:", error);
    res.status(500).json({
      success: false,
      error: error.message || "리뷰 사진 추가 중 오류가 발생했습니다.",
    });
  }
};

// Delete a photo from a review
const deleteReviewPhotoController = async (req, res) => {
  const { photo_id } = req.params;
  
  try {
    await deleteReviewPhoto(photo_id);
    res.json({
      success: true,
      message: "리뷰 사진이 삭제되었습니다."
    });
  } catch (error) {
    console.error("Error in reviewController.deleteReviewPhoto:", error);
    res.status(500).json({
      success: false,
      error: error.message || "리뷰 사진 삭제 중 오류가 발생했습니다.",
    });
  }
};

// Update a review with multiple photos
const updateReviewController = async (req, res) => {
  const { review_id } = req.params;
  const { score, comment } = req.body;
  
  try {
    // Handle multiple file uploads
    let photo_blobs = [];
    if (req.file) {
      // Single file upload
      photo_blobs = [req.file.buffer];
    } else if (req.files && req.files.length > 0) {
      // Multiple file uploads
      photo_blobs = req.files.map(file => file.buffer);
    }

    const result = await updateReview(review_id, score, comment, photo_blobs);

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: "리뷰가 성공적으로 수정되었습니다.",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "리뷰를 찾을 수 없습니다.",
      });
    }
  } catch (error) {
    console.error("Error in reviewController.updateReview:", error);
    res.status(500).json({
      success: false,
      error: error.message || "리뷰 수정 중 오류가 발생했습니다.",
    });
  }
};

//리뷰 삭제
const deleteReviewController = async (req, res) => {
  const { review_id } = req.params;
  try {
    const result = await deleteReview(review_id);
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
  getPharmacyReview,
  createReviewController,
  updateReviewController,
  deleteReviewController,
  getReviewPhotosController,
  addReviewPhotoController,
  deleteReviewPhotoController
};
