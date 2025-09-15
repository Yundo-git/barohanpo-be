// src/api/review/review.model.js
// ES Modules, mysql2/promise 기반
// 요구사항: 사진 최대 3장, 기존 유지/추가, 특정 사진만 삭제
// 추가: 리뷰 조회 시 user(이름/닉네임) + pharmacy(이름/주소/전화) JOIN 포함, N+1 없이 사진 묶음 로드

import { db } from "../../config/database.js";
const { pool } = db;

// ──────────────────────────────────────────────────────────────
// 내부 헬퍼: 리뷰 목록에 사진 배열 붙이기 (N+1 방지: IN(…))
// ──────────────────────────────────────────────────────────────
async function attachPhotosToReviews(reviews) {
  if (!reviews || reviews.length === 0) return reviews;

  const reviewIds = reviews.map((r) => r.review_id);
  const [photos] = await pool.query(
    `SELECT review_photo_id, review_id, review_photo_url, review_photo_blob
       FROM review_photos
      WHERE review_id IN (?)
      ORDER BY review_photo_id ASC`,
    [reviewIds]
  );

  // Convert to Map for O(1) lookup
  const photosByReviewId = new Map();
  photos.forEach(photo => {
    if (!photosByReviewId.has(photo.review_id)) {
      photosByReviewId.set(photo.review_id, []);
    }
    photosByReviewId.get(photo.review_id).push(photo);
  });

  // Attach photos to each review
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
  r.review_photo_id,
  r.created_at,

  u.name,
  u.nickname,

  p.name,
  p.address
`;

const FROM_REVIEW_JOIN = `
  FROM reviews r
  LEFT JOIN users u      ON u.user_id = r.user_id
  LEFT JOIN pharmacy p ON p.p_id    = r.p_id
`;

// Define all functions
const reviewModel = {
  // * 모든 리뷰 + 유저/약국 정보 + 사진들
  async findAll() {
    try {
      const [reviews] = await pool.query(`
        SELECT ${SELECT_REVIEW_BASE}
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        JOIN pharmacy p ON r.p_id = p.p_id
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
         FROM reviews r
         JOIN users u ON r.user_id = u.user_id
         JOIN pharmacy p ON r.p_id = p.p_id
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
        `SELECT ${SELECT_REVIEW_BASE}
         ${FROM_REVIEW_JOIN}
         WHERE r.score = 5
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
         FROM reviews r
         JOIN users u ON r.user_id = u.user_id
         JOIN pharmacy p ON r.p_id = p.p_id
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

  // * 리뷰 생성
  async createReview(user_id, p_id, score, comment, book_id, book_date, book_time) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO reviews (user_id, p_id, score, comment, book_id, book_date, book_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, p_id, score, comment, book_id, book_date, book_time]
      );

      await conn.commit();
      return result.insertId;
    } catch (error) {
      await conn.rollback();
      console.error("Error in reviewModel.createReview:", error);
      throw error;
    } finally {
      conn.release();
    }
  },

  // * 리뷰 사진 1장 추가 (초기 등록 용)
  async createReviewPhoto(review_id, photo_blob) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO review_photos (review_id, review_photo_blob)
         VALUES (?, ?)`,
        [review_id, photo_blob]
      );

      // Update the review's review_photo_id to point to the first photo
      if (result.affectedRows > 0) {
        await conn.query(
          `UPDATE reviews SET review_photo_id = ? WHERE review_id = ?`,
          [result.insertId, review_id]
        );
      }

      await conn.commit();
      return result.insertId;
    } catch (error) {
      await conn.rollback();
      console.error("Error in reviewModel.createReviewPhoto:", error);
      throw error;
    } finally {
      conn.release();
    }
  },

  // * 특정 리뷰의 사진들 조회
  async getReviewPhotos(review_id) {
    try {
      const [photos] = await pool.query(
        `SELECT review_photo_id, review_photo_blob
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

  // * 리뷰 사진 추가 (개별)
  async addReviewPhoto(review_id, photo_blob) {
    try {
      const [result] = await pool.query(
        `INSERT INTO review_photos (review_id, review_photo_blob)
         VALUES (?, ?)`,
        [review_id, photo_blob]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error in reviewModel.addReviewPhoto:", error);
      throw error;
    }
  },

  // * 특정 사진 삭제 (개별)
  async deleteReviewPhoto(photo_id) {
    try {
      const [result] = await pool.query(
        `DELETE FROM review_photos WHERE review_photo_id = ?`,
        [photo_id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error in reviewModel.deleteReviewPhoto:", error);
      throw error;
    }
  },

  // * 리뷰 수정 + 사진 부분 업데이트(유지/추가/삭제, 최대 3장)
  async updateReviewWithPhotos(reviewId, score, comment, keepIds = [], newPhotoBuffers = []) {
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
        // If no keepIds, delete all photos
        await conn.query(
          `DELETE FROM review_photos WHERE review_id = ?`,
          [reviewId]
        );
      }

      // 3. Add new photos
      for (const buffer of newPhotoBuffers) {
        await conn.query(
          `INSERT INTO review_photos (review_id, review_photo_blob)
           VALUES (?, ?)`,
          [reviewId, buffer]
        );
      }

      // 4. Update review_photo_id to the first photo if exists
      const [photos] = await conn.query(
        `SELECT review_photo_id FROM review_photos 
         WHERE review_id = ? 
         ORDER BY review_photo_id ASC 
         LIMIT 1`,
        [reviewId]
      );

      if (photos.length > 0) {
        await conn.query(
          `UPDATE reviews 
           SET review_photo_id = ? 
           WHERE review_id = ?`,
          [photos[0].review_photo_id, reviewId]
        );
      } else {
        // No photos left, set review_photo_id to NULL
        await conn.query(
          `UPDATE reviews 
           SET review_photo_id = NULL 
           WHERE review_id = ?`,
          [reviewId]
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

      // 1. Delete photos first
      await conn.query(
        `DELETE FROM review_photos WHERE review_id = ?`,
        [review_id]
      );

      // 2. Then delete the review
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
  //  * 특정 유저의 리뷰 book_id 목록만 조회
  //  */
  // findOneId: async (user_id) => {
  //   try {
  //     const [rows] = await db.query(
  //       "SELECT book_id FROM reviews WHERE user_id = ?",
  //       [user_id]
  //     );
  //     return rows;
  //   } catch (error) {
  //     console.error("Error in reviewModel.findOneId:", error);
  //     throw error;
  //   }
  // },

  // /**
  //  * 평점 5점 리뷰 + 유저/약국 정보 + 사진들
  //  */
  // findFiveStarReview: async () => {
  //   try {
  //     const [rows] = await db.query(
  //       `SELECT ${SELECT_REVIEW_BASE}
  //        ${FROM_REVIEW_JOIN}
  //        WHERE r.score = 5
  //        ORDER BY r.review_id DESC`
  //     );
  //     return attachPhotosToReviews(rows);
  //   } catch (error) {
  //     console.error("Error in reviewModel.findFiveStarReview:", error);
  //     throw error;
  //   }
  // },

  // /**
  //  * 약국ID로 리뷰 + 유저/약국 정보 + 사진들
  //  */
  // findPharmacyReview: async (pharmacyId) => {
  //   try {
  //     const [rows] = await db.query(
  //       `SELECT ${SELECT_REVIEW_BASE}
  //        ${FROM_REVIEW_JOIN}
  //        WHERE r.p_id = ?
  //        ORDER BY r.review_id DESC`,
  //       [pharmacyId]
  //     );
  //     return attachPhotosToReviews(rows);
  //   } catch (error) {
  //     console.error("Error in reviewModel.findPharmacyReview:", error);
  //     throw error;
  //   }
  // },

  // /**
  //  * 리뷰 생성
  //  */
  // createReview: async function (
  //   user_id,
  //   p_id,
  //   score,
  //   comment,
  //   book_id,
  //   book_date,
  //   book_time
  // ) {
  //   try {
  //     const [result] = await db.query(
  //       `INSERT INTO reviews
  //        (user_id, p_id, score, comment, book_id, book_date, book_time)
  //        VALUES (?, ?, ?, ?, ?, ?, ?)`,
  //       [user_id, p_id, score, comment, book_id, book_date, book_time]
  //     );
  //     return result.insertId;
  //   } catch (error) {
  //     console.error("Error in reviewModel.createReview:", error);
  //     throw error;
  //   }
  // },

  // /**
  //  * 리뷰 사진 1장 추가 (초기 등록 용)
  //  * reviews.review_photo_id(대표 이미지)도 갱신
  //  */
  // createReviewPhoto: async function (review_id, photo_blob) {
  //   try {
  //     const [result] = await db.query(
  //       "INSERT INTO review_photos (review_id, review_photo_url, review_photo_blob) VALUES (?, NULL, ?)",
  //       [review_id, photo_blob]
  //     );

  //     await db.query(
  //       "UPDATE reviews SET review_photo_id = ? WHERE review_id = ?",
  //       [result.insertId, review_id]
  //     );

  //     return result.insertId;
  //   } catch (error) {
  //     console.error("Error in reviewModel.createReviewPhoto:", error);
  //     throw error;
  //   }
  // },

  // /**
  //  * 특정 리뷰의 사진들 조회
  //  */
  // getReviewPhotos: async function (review_id) {
  //   try {
  //     const [photos] = await pool.query(
  //       `SELECT review_photo_id, review_id, review_photo_url, review_photo_blob
  //          FROM review_photos
  //         WHERE review_id = ?
  //         ORDER BY review_photo_id ASC`,
  //       [review_id]
  //     );
  //     return photos;
  //   } catch (error) {
  //     console.error("Error in reviewModel.getReviewPhotos:", error);
  //     throw error;
  //   }
  // },

  // /**
  //  * 리뷰 사진 추가 (개별)
  //  */
  // addReviewPhoto: async function (review_id, photo_blob) {
  //   try {
  //     const [result] = await db.query(
  //       "INSERT INTO review_photos (review_id, review_photo_url, review_photo_blob) VALUES (?, NULL, ?)",
  //       [review_id, photo_blob]
  //     );
  //     return result.insertId;
  //   } catch (error) {
  //     console.error("Error in reviewModel.addReviewPhoto:", error);
  //     throw error;
  //   }
  // },

  // /**
  //  * 특정 사진 삭제 (개별)
  //  */
  // deleteReviewPhoto: async function (photo_id) {
  //   try {
  //     await db.query("DELETE FROM review_photos WHERE review_photo_id = ?", [
  //       photo_id,
  //     ]);
  //     return true;
  //   } catch (error) {
  //     console.error("Error in reviewModel.deleteReviewPhoto:", error);
  //     throw error;
  //   }
  // },

  // /**
  //  * 리뷰 수정 + 사진 부분 업데이트(유지/추가/삭제, 최대 3장)
  //  * keepIds: 유지할 기존 review_photo_id 배열
  //  * newPhotoBuffers: 새로 추가할 사진 버퍼 배열
  //  * 최종 개수: keepIds.length + newPhotoBuffers.length <= 3
  //  */
  // updateReviewWithPhotos: async function (
  //   reviewId,
  //   score,
  //   comment,
  //   keepIds = [],
  //   newPhotoBuffers = []
  // ) {
  //   const conn = await db.getConnection();
  //   try {
  //     await conn.beginTransaction();

  //     // 현재 사진 ID 목록
  //     const [rows] = await conn.query(
  //       "SELECT review_photo_id FROM review_photos WHERE review_id = ?",
  //       [reviewId]
  //     );
  //     const currentIds = rows.map((r) => r.review_photo_id);

  //     // 삭제 대상 = 현재 - keep
  //     const deleteIds = currentIds.filter((id) => !keepIds.includes(id));

  //     // 최종 개수 검증 (유지 + 신규)
  //     const finalCount = keepIds.length + newPhotoBuffers.length;
  //     if (finalCount > 3) {
  //       await conn.rollback();
  //       throw new Error("사진은 최대 3장까지 가능합니다.");
  //     }

  //     // 리뷰 본문/점수 업데이트
  //     const [upd] = await conn.query(
  //       "UPDATE reviews SET score = ?, comment = ? WHERE review_id = ?",
  //       [score, comment, reviewId]
  //     );

  //     // 특정 사진만 삭제
  //     if (deleteIds.length > 0) {
  //       await conn.query(
  //         `DELETE FROM review_photos
  //            WHERE review_id = ?
  //              AND review_photo_id IN (${deleteIds.map(() => "?").join(",")})`,
  //         [reviewId, ...deleteIds]
  //       );
  //     }

  //     // 신규 사진 추가
  //     if (newPhotoBuffers.length > 0) {
  //       const insertSql =
  //         "INSERT INTO review_photos (review_id, review_photo_url, review_photo_blob) VALUES (?, NULL, ?)";
  //       for (const buf of newPhotoBuffers) {
  //         await conn.query(insertSql, [reviewId, buf]);
  //       }
  //     }

  //     // 대표 이미지(첫 사진) 동기화
  //     const [after] = await conn.query(
  //       "SELECT review_photo_id FROM review_photos WHERE review_id = ? ORDER BY review_photo_id ASC LIMIT 1",
  //       [reviewId]
  //     );
  //     const firstPhotoId = after.length > 0 ? after[0].review_photo_id : null;

  //     await conn.query(
  //       "UPDATE reviews SET review_photo_id = ? WHERE review_id = ?",
  //       [firstPhotoId, reviewId]
  //     );

  //     await conn.commit();

  //     return {
  //       success: true,
  //       affectedRows: upd.affectedRows,
  //       kept: keepIds,
  //       added: newPhotoBuffers.length,
  //       deleted: deleteIds.length,
  //       firstPhotoId,
  //     };
  //   } catch (error) {
  //     await conn.rollback();
  //     console.error("Error in reviewModel.updateReviewWithPhotos:", error);
  //     throw error;
  //   } finally {
  //     conn.release();
  //   }
  // },

  // /**
  //  * 리뷰 삭제 (사진부터 삭제 후 리뷰 삭제)
  //  */
  // deleteReview: async function (review_id) {
  //   const conn = await db.getConnection();
  //   try {
  //     await conn.beginTransaction();

  //     await conn.query("DELETE FROM review_photos WHERE review_id = ?", [
  //       review_id,
  //     ]);

  //     const [result] = await conn.query(
  //       "DELETE FROM reviews WHERE review_id = ?",
  //       [review_id]
  //     );

  //     await conn.commit();
  //     return result.affectedRows > 0;
  //   } catch (error) {
  //     await conn.rollback();
  //     console.error("Error in reviewModel.deleteReview:", error);
  //     throw error;
  //   } finally {
  //     conn.release();
  //   }
  // },
// };

// Export the reviewModel object with all the functions
// export default {
//   findAll,
//   findById,
//   findOneId,
//   findFiveStarReview,
//   findPharmacyReview,
//   createReview,
//   createReviewPhoto,
//   getReviewPhotos,
//   addReviewPhoto,
//   deleteReviewPhoto,
//   updateReviewWithPhotos,
//   deleteReview,
// };
