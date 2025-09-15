// src/api/review/review.model.js

import { db } from "../../config/database.js";
const { pool } = db;

async function attachPhotosToReviews(reviews) {
  if (!reviews || reviews.length === 0) return reviews;

  const reviewIds = reviews.map((r) => r.review_id);
  const [photos] = await pool.query(
    `SELECT review_photo_id, review_id, review_photo_url
       FROM review_photos
      WHERE review_id IN (?)
      ORDER BY review_photo_id ASC`,
    [reviewIds]
  );

  const photosByReviewId = new Map();
  photos.forEach(photo => {
    if (!photosByReviewId.has(photo.review_id)) {
      photosByReviewId.set(photo.review_id, []);
    }
    photosByReviewId.get(photo.review_id).push(photo);
  });

  return reviews.map(review => ({
    ...review,
    photos: photosByReviewId.get(review.review_id) || []
  }));
}

const SELECT_REVIEW_BASE = `
  r.review_id,
  r.user_id,
  r.p_id,
  r.score,
  r.comment,
  r.book_id,
  r.book_date,
  r.book_time,
  r.created_at,

  u.name,
  u.nickname,

  p.name,
  p.address,
  upp.photo_url AS user_profile_photo_url
`;

const FROM_REVIEW_JOIN = `
  FROM reviews r
  LEFT JOIN users u         ON u.user_id = r.user_id
  LEFT JOIN pharmacy p ON p.p_id           = r.p_id
  LEFT JOIN user_profile_photos upp ON upp.user_id = u.user_id
`;

const reviewModel = {
  // * 모든 리뷰 + 유저/약국 정보 + 사진들
  async findAll() {
    try {
      const [reviews] = await pool.query(`
        SELECT ${SELECT_REVIEW_BASE}
          ${FROM_REVIEW_JOIN}
      ORDER BY r.created_at DESC
      `);
      return await attachPhotosToReviews(reviews);
    } catch (error) {
      console.error("Error in reviewModel.findAll:", error);
      throw error;
    }
  },

  // * 특정 유저의 리뷰 + 유저/약국 정보 + 사진들
  async findById(user_id) {
    try {
      const [reviews] = await pool.query(
        `SELECT ${SELECT_REVIEW_BASE}
          ${FROM_REVIEW_JOIN}
          WHERE r.user_id = ?
          ORDER BY r.created_at DESC`,
        [user_id]
      );
      return await attachPhotosToReviews(reviews);
    } catch (error) {
      console.error("Error in reviewModel.findById:", error);
      throw error;
    }
  },

  // * 특정 유저의 리뷰 book_id 목록만 조회
  async findOneId(user_id) {
    try {
      const [rows] = await pool.query(
        `SELECT book_id FROM reviews WHERE user_id = ?`,
        [user_id]
      );
      return rows.map((row) => row.book_id);
    } catch (error) {
      console.error("Error in reviewModel.findOneId:", error);
      throw error;
    }
  },

  // * 평점 5점 리뷰 + 유저/약국 정보 + 사진들
  async findFiveStarReview() {
    try {
      const [reviews] = await pool.query(
        `SELECT
          ${SELECT_REVIEW_BASE}
         ${FROM_REVIEW_JOIN}
         WHERE r.score = 5
         AND EXISTS (
           SELECT 1
           FROM review_photos rp
           WHERE rp.review_id = r.review_id
         )
         ORDER BY r.review_id DESC`
      );
      return await attachPhotosToReviews(reviews);
    } catch (error) {
      console.error("Error in reviewModel.findFiveStarReview:", error);
      throw error;
    }
  },
  // * 약국ID로 리뷰 + 유저/약국 정보 + 사진들
  async findPharmacyReview(pharmacyId) {
    try {
      const [reviews] = await pool.query(
        `SELECT ${SELECT_REVIEW_BASE}
          ${FROM_REVIEW_JOIN}
          WHERE r.p_id = ?
          ORDER BY r.created_at DESC`,
        [pharmacyId]
      );
      return await attachPhotosToReviews(reviews);
    } catch (error) {
      console.error("Error in reviewModel.findPharmacyReview:", error);
      throw error;
    }
  },

  // * 리뷰 생성 (트랜잭션 제외, 서비스에서 처리)
  async createReview(conn, user_id, p_id, score, comment, book_id, book_date, book_time) {
    const [result] = await conn.query(
      `INSERT INTO reviews (user_id, p_id, score, comment, book_id, book_date, book_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, p_id, score, comment, book_id, book_date, book_time]
    );
    return result.insertId;
  },

  // * 리뷰 사진 여러 장 추가 (트랜잭션 제외, 서비스에서 처리)
  async createReviewPhotos(conn, review_id, photoUrls) {
    if (!photoUrls || photoUrls.length === 0) return;

    const values = photoUrls.map(url => [review_id, url]);
    const [result] = await conn.query(
      `INSERT INTO review_photos (review_id, review_photo_url) VALUES ?`,
      [values]
    );
    return result.affectedRows;
  },

  // * 특정 리뷰의 사진들 조회
  async getReviewPhotos(review_id) {
    try {
      const [photos] = await pool.query(
        `SELECT review_photo_id, review_photo_url
          FROM review_photos
          WHERE review_id = ?
          ORDER BY review_photo_id ASC`,
        [review_id]
      );
      return photos;
    } catch (error) {
      console.error("Error in reviewModel.getReviewPhotos:", error);
      throw error;
    }
  },

  // * 특정 사진의 URL 조회
  async getReviewPhotoUrlById(photo_id) {
    try {
      const [rows] = await pool.query(
        `SELECT review_photo_url FROM review_photos WHERE review_photo_id = ?`,
        [photo_id]
      );
      return rows[0];
    } catch (error) {
      console.error("Error in reviewModel.getReviewPhotoUrlById:", error);
      throw error;
    }
  },

  // * 리뷰 사진 추가 (개별)
  async addReviewPhoto(review_id, photo_url) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        `INSERT INTO review_photos (review_id, review_photo_url) VALUES (?, ?)`,
        [review_id, photo_url]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error in reviewModel.addReviewPhoto:", error);
      throw error;
    } finally {
      conn.release();
    }
  },

  // * 특정 사진 삭제 (개별)
  async deleteReviewPhoto(photo_id) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        `DELETE FROM review_photos WHERE review_photo_id = ?`,
        [photo_id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error in reviewModel.deleteReviewPhoto:", error);
      throw error;
    } finally {
      conn.release();
    }
  },

  // * 리뷰 수정 + 사진 부분 업데이트(유지/추가/삭제)
  async updateReviewWithPhotos(reviewId, score, comment, keepIds = [], newPhotoUrls = []) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Update review text and score
      await conn.query(
        `UPDATE reviews SET score = ?, comment = ? WHERE review_id = ?`,
        [score, comment, reviewId]
      );

      // 2. Delete photos not in keepIds
      if (keepIds.length > 0) {
        await conn.query(
          `DELETE FROM review_photos 
           WHERE review_id = ? AND review_photo_id NOT IN (?)`,
          [reviewId, keepIds]
        );
      } else {
        await conn.query(
          `DELETE FROM review_photos WHERE review_id = ?`,
          [reviewId]
        );
      }

      // 3. Add new photos
      if (newPhotoUrls.length > 0) {
        const values = newPhotoUrls.map(url => [reviewId, url]);
        await conn.query(
          `INSERT INTO review_photos (review_id, review_photo_url) VALUES ?`,
          [values]
        );
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      console.error("Error in reviewModel.updateReviewWithPhotos:", error);
      throw error;
    } finally {
      conn.release();
    }
  },

  // * 리뷰 삭제 (사진부터 삭제 후 리뷰 삭제)
  async deleteReview(review_id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `DELETE FROM review_photos WHERE review_id = ?`,
        [review_id]
      );

      const [result] = await conn.query(
        `DELETE FROM reviews WHERE review_id = ?`,
        [review_id]
      );

      await conn.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await conn.rollback();
      console.error("Error in reviewModel.deleteReview:", error);
      throw error;
    } finally {
      conn.release();
    }
  }
};

export default reviewModel;