const db = require("../../config/database");

const reviewModel = {
  findAll: async () => {
    try {
      const [reviews] = await db.query("SELECT * FROM reviews");

      // Fetch photos for each review that has a photo_id
      const reviewsWithPhotos = await Promise.all(
        reviews.map(async (review) => {
          if (review.review_id) {
            const [photos] = await db.query(
              "SELECT * FROM review_photos WHERE review_id = ?",
              [review.review_id]
            );
            return {
              ...review,
              photos: photos || [],
            };
          }
          return {
            ...review,
            photos: [],
          };
        })
      );

      return reviewsWithPhotos;
    } catch (error) {
      console.error("Error in reviewModel.findAll:", error);
      throw error;
    }
  },
  //특정 user_id로 review 조회
  findById: async (user_id) => {
    try {
      const [reviews] = await db.query(
        "SELECT * FROM reviews WHERE user_id = ?",
        [user_id]
      );

      // Fetch photos for each review that has a photo_id
      const reviewsWithPhotos = await Promise.all(
        reviews.map(async (review) => {
          if (review.review_id) {
            const [photos] = await db.query(
              "SELECT * FROM review_photos WHERE review_id = ?",
              [review.review_id]
            );
            return {
              ...review,
              photos: photos || [],
            };
          }
          return {
            ...review,
            photos: [],
          };
        })
      );

      return reviewsWithPhotos;
    } catch (error) {
      console.error("Error in reviewModel.findById:", error);
      throw error;
    }
  },
  //특정 user_id로 book_id 조회
  findOneId: async (user_id) => {
    try {
      const [rows] = await db.query(
        "SELECT book_id FROM reviews WHERE user_id = ?",
        [user_id]
      );
      return rows;
    } catch (error) {
      console.error("Error in reviewModel.findOneId:", error);
      throw error;
    }
  },
  //평점이 5점인애들만 조회
  findFiveStarReview: async () => {
    try {
      const [reviews] = await db.query("SELECT * FROM reviews WHERE score = 5");

      // Fetch photos for each 5-star review that has a photo_id
      const reviewsWithPhotos = await Promise.all(
        reviews.map(async (review) => {
          if (review.review_id) {
            const [photos] = await db.query(
              "SELECT * FROM review_photos WHERE review_id = ?",
              [review.review_id]
            );
            return {
              ...review,
              photos: photos || [],
            };
          }
          return {
            ...review,
            photos: [],
          };
        })
      );

      return reviewsWithPhotos;
    } catch (error) {
      console.error("Error in reviewModel.findFiveStarReview:", error);
      throw error;
    }
  },

  findPharmacyReview: async (pharmacyId) => {
    try {
      const [reviews] = await db.query("SELECT * FROM reviews WHERE p_id = ?", [
        pharmacyId,
      ]);

      // Fetch photos for each review that has a photo_id
      const reviewsWithPhotos = await Promise.all(
        reviews.map(async (review) => {
          if (review.review_id) {
            const [photos] = await db.query(
              "SELECT * FROM review_photos WHERE review_id = ?",
              [review.review_id]
            );
            return {
              ...review,
              photos: photos || [],
            };
          }
          return {
            ...review,
            photos: [],
          };
        })
      );

      return reviewsWithPhotos;
    } catch (error) {
      console.error("Error in reviewModel.findPharmacyReview:", error);
      throw error;
    }
  },

  createReview: async function (
    user_id,
    p_id,
    score,
    comment,
    book_id,
    book_date,
    book_time
  ) {
    try {
      const [result] = await db.query(
        "INSERT INTO reviews (user_id, p_id, score, comment, book_id, book_date, book_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user_id, p_id, score, comment, book_id, book_date, book_time]
      );
      return result.insertId; // Return the new review_id
    } catch (error) {
      console.error("Error in reviewModel.createReview:", error);
      throw error;
    }
  },

  createReviewPhoto: async function (review_id, photo_blob) {
    try {
      const [result] = await db.query(
        "INSERT INTO review_photos (review_id, review_photo_blob) VALUES (?, ?)",
        [review_id, photo_blob]
      );

      // Update the review with the new photo_id
      await db.query(
        "UPDATE reviews SET review_photo_id = ? WHERE review_id = ?",
        [result.insertId, review_id]
      );

      return result.insertId;
    } catch (error) {
      console.error("Error in reviewModel.createReviewPhoto:", error);
      throw error;
    }
  },

  // Get all photos for a review
  getReviewPhotos: async function (review_id) {
    try {
      const [photos] = await db.query(
        "SELECT * FROM review_photos WHERE review_id = ? ",
        [review_id]
      );
      return photos;
    } catch (error) {
      console.error("Error in reviewModel.getReviewPhotos:", error);
      throw error;
    }
  },

  // Add a new photo to a review
  addReviewPhoto: async function (review_id, photo_blob) {
    try {
      const [result] = await db.query(
        "INSERT INTO review_photos (review_id, review_photo_blob) VALUES (?, ?)",
        [review_id, photo_blob]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error in reviewModel.addReviewPhoto:", error);
      throw error;
    }
  },

  // Delete a photo from a review
  deleteReviewPhoto: async function (photo_id) {
    try {
      await db.query("DELETE FROM review_photos WHERE review_photo_id = ?", [
        photo_id,
      ]);
      return true;
    } catch (error) {
      console.error("Error in reviewModel.deleteReviewPhoto:", error);
      throw error;
    }
  },

  updateReview: async function (review_id, score, comment, photo_blobs = []) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. 리뷰 텍스트 업데이트
      const [result] = await connection.query(
        "UPDATE reviews SET score = ?, comment = ? WHERE review_id = ?",
        [score, comment, review_id]
      );

      // 2. 기존 사진 조회
      const [existingPhotos] = await connection.query(
        "SELECT review_photo_id FROM review_photos WHERE review_id = ? ",
        [review_id]
      );

      // 3. 사진 업데이트
      if (photo_blobs && photo_blobs.length > 0) {
        // 기존 사진 삭제
        if (existingPhotos.length > 0) {
          await connection.query(
            "DELETE FROM review_photos WHERE review_id = ?",
            [review_id]
          );
        }

        // 새 사진 추가
        let firstPhotoId = null;
        for (const photo_blob of photo_blobs) {
          const [photoResult] = await connection.query(
            "INSERT INTO review_photos (review_id, review_photo_blob) VALUES (?, ?)",
            [review_id, photo_blob]
          );

          // 첫 번째 사진 ID 저장
          if (!firstPhotoId) {
            firstPhotoId = photoResult.insertId;
          }
        }

        // 리뷰 테이블에 첫 번째 사진 ID 업데이트
        if (firstPhotoId) {
          await connection.query(
            "UPDATE reviews SET review_photo_id = ? WHERE review_id = ?",
            [firstPhotoId, review_id]
          );
        }
      } else if (existingPhotos.length > 0) {
        // If no new photos are provided but there were existing ones, remove them all
        await connection.query(
          "DELETE FROM review_photos WHERE review_id = ?",
          [review_id]
        );
      }

      await connection.commit();
      return { success: true, affectedRows: result.affectedRows };
    } catch (error) {
      await connection.rollback();
      console.error("Error in reviewModel.updateReview:", error);
      throw error;
    } finally {
      connection.release();
    }
  },

  deleteReview: async function (review_id) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. 사진부터 지우기
      await connection.query("DELETE FROM review_photos WHERE review_id = ?", [
        review_id,
      ]);

      // 2. 리뷰 지우기
      const [result] = await connection.query(
        "DELETE FROM reviews WHERE review_id = ?",
        [review_id]
      );

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error("Error in reviewModel.deleteReview:", error);
      throw error;
    } finally {
      connection.release();
    }
  },
};

module.exports = { reviewModel };
