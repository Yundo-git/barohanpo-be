// src/api/favorites/favorites.model.js

import { db } from "../../config/database.js";
const { pool } = db;

export const favoritesModel = {
    /**
     * 특정 약국이 사용자의 찜 목록에 있는지 확인합니다.
     * @param {number} userId - 사용자 ID
     * @param {number} pharmacyId - 약국 ID
     * @returns {Promise<boolean>} - 찜 여부
     */
    async getFavoriteStatus(userId, pharmacyId) {
        try {
            const [rows] = await pool.query(
                `SELECT COUNT(*) as count FROM pharmacy_favorites WHERE user_id = ? AND pharmacy_id = ?`,
                [userId, pharmacyId]
            );
            return rows[0].count > 0;
        } catch (error) {
            console.error("Error in getFavoriteStatus:", error);
            throw error;
        }
    },

    /**
     * 찜 목록에 약국을 추가하거나 이미 존재하면 아무것도 하지 않습니다. (UPSERT)
     * @param {number} userId - 사용자 ID
     * @param {number} pharmacyId - 약국 ID
     * @returns {Promise<number>} - 삽입된 행의 ID (0이면 기존 행)
     */
    async addFavorite(userId, pharmacyId) {
        try {
            const [result] = await pool.query(
                `INSERT INTO pharmacy_favorites (user_id, pharmacy_id)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE user_id = user_id`, // 변경 없이 업데이트
                [userId, pharmacyId]
            );
            return result.insertId;
        } catch (error) {
            console.error("Error in addFavorite:", error);
            throw error;
        }
    },

    /**
     * 찜 목록에서 약국을 제거합니다.
     * @param {number} userId - 사용자 ID
     * @param {number} pharmacyId - 약국 ID
     * @returns {Promise<boolean>} - 삭제 성공 여부
     */
    async removeFavorite(userId, pharmacyId) {
        try {
            const [result] = await pool.query(
                `DELETE FROM pharmacy_favorites WHERE user_id = ? AND pharmacy_id = ?`,
                [userId, pharmacyId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Error in removeFavorite:", error);
            throw error;
        }
    },
    
    /**
     * 특정 사용자의 찜 목록을 조회
     * @param {number} userId - 사용자 ID
     * @returns {Promise<Array<Object>>} - 찜 목록 데이터
     */
    async getFavoritesByUserId(userId) {
        try {
            const [rows] = await pool.query(
                `SELECT
                    p.p_id,
                    p.name,
                    p.address,
                    p.latitude,
                    p.longitude,
                    f.created_at
                FROM
                    pharmacy_favorites AS f
                JOIN
                    pharmacy AS p
                ON
                    f.pharmacy_id = p.p_id
                WHERE
                    f.user_id = ?
                ORDER BY
                    f.created_at DESC`,
                [userId]
            );
            return rows;
        } catch (error) {
            console.error("Error in getFavoritesByUserId:", error);
            throw error;
        }
    },

};