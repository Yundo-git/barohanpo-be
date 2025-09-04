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
    // console.log("in model", photo_blob.length);
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

  updateReview: async function (
    review_id,
    score,
    comment,
    { newPhotos = [], existingPhotoIds = [], hasPhotoChanges = false } = {}
  ) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Update review text and score
      const [result] = await connection.query(
        "UPDATE reviews SET score = ?, comment = ? WHERE review_id = ?",
        [score, comment, review_id]
      );

      // 2. Process photo updates only if there are changes
      if (hasPhotoChanges) {
        // 3. Get current photos
        const [currentPhotos] = await connection.query(
          "SELECT review_photo_id FROM review_photos WHERE review_id = ?",
          [review_id]
        );

        // 4. Delete photos that are not in the existingPhotoIds list
        if (currentPhotos.length > 0) {
          if (existingPhotoIds.length > 0) {
            // Delete only the photos that are not in the existingPhotoIds list
            const placeholders = existingPhotoIds.map(() => "?").join(",");
            const params = [review_id, ...existingPhotoIds];
            await connection.query(
              `DELETE FROM review_photos WHERE review_id = ? AND review_photo_id NOT IN (${placeholders})`,
              params
            );
          } else if (existingPhotoIds.length === 0 && newPhotos.length > 0) {
            // If no existing photo IDs are provided and there are new photos, delete all existing photos
            await connection.query(
              "DELETE FROM review_photos WHERE review_id = ?",
              [review_id]
            );
          }
        }

        // 5. Add new photos if any
        let firstPhotoId = null;
        if (newPhotos.length > 0) {
          for (const photo_blob of newPhotos) {
            const [photoResult] = await connection.query(
              "INSERT INTO review_photos (review_id, review_photo_blob) VALUES (?, ?)",
              [review_id, photo_blob]
            );

            // Save the first photo ID
            if (!firstPhotoId) {
              firstPhotoId = photoResult.insertId;
            }
          }
        }

        // 6. Update the review's main photo ID if needed
        if (existingPhotoIds.length > 0 || newPhotos.length > 0) {
          let newMainPhotoId = null;

          // If we have existing photos, use the first one as main
          if (existingPhotoIds.length > 0) {
            newMainPhotoId = existingPhotoIds[0];
          }
          // Otherwise, if we have new photos, use the first new one
          else if (firstPhotoId) {
            newMainPhotoId = firstPhotoId;
          }

          if (newMainPhotoId) {
            await connection.query(
              "UPDATE reviews SET review_photo_id = ? WHERE review_id = ?",
              [newMainPhotoId, review_id]
            );
          }
        }
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
