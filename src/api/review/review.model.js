const db = require("../../config/database");

const reviewModel = {
  findAll: async () => {
    try {
      const [rows] = await db.query("SELECT * FROM review");
      return rows;
    } catch (error) {
      console.error("Error in reviewModel.findAll:", error);
      throw error;
    }
  },

  findById: async (user_id) => {
    try {
      const [rows] = await db.query("SELECT * FROM reviews WHERE user_id = ?", [
        user_id,
      ]);
      return rows;
    } catch (error) {
      console.error("Error in reviewModel.findById:", error);
      throw error;
    }
  },
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
  findFiveStarReview: async () => {
    try {
      const [rows] = await db.query("SELECT * FROM reviews WHERE score = 5");
      console.log("rowssssss", rows);
      return rows;
    } catch (error) {
      console.error("Error in reviewModel.findFiveStarReview:", error);
      throw error;
    }
  },

  createReview: async (
    user_id,
    p_id,
    score,
    comment,
    book_id,
    book_date,
    book_time
  ) => {
    try {
      const [rows] = await db.query(
        "INSERT INTO reviews (user_id, p_id, score, comment , book_id, book_date, book_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user_id, p_id, score, comment, book_id, book_date, book_time]
      );
      return rows[0];
    } catch (error) {
      console.error("Error in reviewModel.createReview:", error);
      throw error;
    }
  },

  updateReview: async (id, review, rating) => {
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

  deleteReview: async (id) => {
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
