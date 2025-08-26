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

    findById: async (id) => {
        try {
            const [rows] = await db.query("SELECT * FROM review WHERE id = ?", [id]);
            return rows[0];
        } catch (error) {
            console.error("Error in reviewModel.findById:", error);
            throw error;
        }
    },

    createReview: async (user_id, p_id, review, rating) => {
        try {
            const [rows] = await db.query("INSERT INTO review (user_id, p_id, review, rating) VALUES (?, ?, ?, ?)", [user_id, p_id, review, rating]);
            return rows[0];
        } catch (error) {
            console.error("Error in reviewModel.createReview:", error);
            throw error;
        }
    },

    updateReview: async (id, review, rating) => {
        try {
            const [rows] = await db.query("UPDATE review SET review = ?, rating = ? WHERE id = ?", [review, rating, id]);
            return rows[0];
        } catch (error) {
            console.error("Error in reviewModel.updateReview:", error);
            throw error;
        }
    },

    deleteReview: async (id) => {
        try {
            const [rows] = await db.query("DELETE FROM review WHERE id = ?", [id]);
            return rows[0];
        } catch (error) {
            console.error("Error in reviewModel.deleteReview:", error);
            throw error;
        }
    },
}

