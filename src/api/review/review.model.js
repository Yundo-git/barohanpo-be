const db = require("../../config/database");

const reviewModel = {
  findAll: async () => {
    try {
      const [reviews] = await db.query("SELECT * FROM reviews");

      // Fetch photos for each review that has a photo_id
      const reviewsWithPhotos = await Promise.all(
        reviews.map(async (review) => {
          if (review.review_photo_id) {
            const [photos] = await db.query(
              "SELECT * FROM review_photos WHERE review_photo_id = ?",
              [review.review_photo_id]
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
          if (review.review_photo_id) {
            const [photos] = await db.query(
              "SELECT * FROM review_photos WHERE review_photo_id = ?",
              [review.review_photo_id]
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
          if (review.review_photo_id) {
            const [photos] = await db.query(
              "SELECT * FROM review_photos WHERE review_photo_id = ?",
              [review.review_photo_id]
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
          if (review.review_photo_id) {
            const [photos] = await db.query(
              "SELECT * FROM review_photos WHERE review_photo_id = ?",
              [review.review_photo_id]
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

  updateReview: async function (id, review, rating) {
    try {
      const [rows] = await db.query(
        "UPDATE review SET review = ?, rating = ? WHERE id = ?",
        [review, rating, id]
      );
      return rows[0];
    } catch (error) {
      console.error("Error in reviewModel.updateReview:", error);
      throw error;
    }
  },

  deleteReview: async function (id) {
    try {
      const [rows] = await db.query("DELETE FROM reviews WHERE id = ?", [id]);
      return rows[0];
    } catch (error) {
      console.error("Error in reviewModel.deleteReview:", error);
      throw error;
    }
  },
};

module.exports = { reviewModel };
