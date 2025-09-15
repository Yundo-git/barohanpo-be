// userProfilePhoto.model.js
import db from "../../config/database.js";
import { logger } from "../../utils/logger.js";

class UserProfilePhoto {
  /**
   * 사용자 프로필 사진 URL을 생성하거나 업데이트합니다.
   * @param {number} userId - 사용자 ID
   * @param {string} photoUrl - Vercel Blob에 저장된 이미지 URL
   * @returns {Promise<object>} 업데이트된 프로필 사진 정보
   */
  static async upsertProfilePhoto(userId, photoUrl) {
    const sql = `
      INSERT INTO user_profile_photos (user_id, photo_url)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE 
        photo_url = VALUES(photo_url)
    `;

    try {
      const [result] = await db.execute(sql, [userId, photoUrl]);
      return {
        id: result.insertId || userId,
        userId,
        photoUrl,
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error("프로필 사진 URL 저장 중 오류 발생:", error);
      throw new Error("프로필 사진 URL을 저장하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 사용자 프로필 사진 URL을 조회합니다.
   * @param {number} userId - 사용자 ID
   * @returns {Promise<string|null>} 프로필 사진 URL (없으면 null)
   */
  static async getProfilePhotoUrl(userId) {
    const sql = `
      SELECT photo_url
      FROM user_profile_photos 
      WHERE user_id = ? 
      LIMIT 1
    `;

    try {
      const [rows] = await db.execute(sql, [userId]);
      return rows.length > 0 ? rows[0].photo_url : null;
    } catch (error) {
      logger.error("프로필 사진 URL 조회 중 오류 발생:", error);
      throw new Error("프로필 사진 URL을 조회하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 기본 프로필 이미지 URL을 설정합니다.
   * @param {number} userId - 사용자 ID
   * @returns {Promise<object>} 생성된 프로필 사진 정보
   */
  static async createDefaultProfilePhoto(userId) {
    const defaultImageUrl =
      "https://barohanpo.blob.vercel-storage.com/assets/sample_profile.jpeg";
    return await this.upsertProfilePhoto(userId, defaultImageUrl);
  }

  /**
   * URL에서 프로필 사진을 가져와 Vercel Blob에 저장하고 DB에 URL을 업데이트합니다.
   * @param {number} userId - 사용자 ID
   * @param {string} imageUrl - 다운로드할 이미지 URL
   * @returns {Promise<object>} 저장된 프로필 사진 정보
   */
  static async createProfilePhotoFromUrl(userId, imageUrl) {
    logger.info(`URL에서 프로필 이미지 다운로드 및 업로드 시작: ${imageUrl}`);
    try {
      logger.info(`URL에서 프로필 이미지 다운로드 시작: ${imageUrl}`);
      const fetch = (await import("node-fetch")).default;
      const { upload } = await import("@vercel/blob");
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`이미지 다운로드 실패: ${response.statusText}`);
      }

      const photoData = await response.buffer();
      const mimeType = response.headers.get("content-type");

      const { url } = await upload(`${userId}-${Date.now()}`, photoData, {
        access: "public",
        contentType: mimeType || undefined,
      });

      return await this.upsertProfilePhoto(userId, url);
    } catch (error) {
      logger.error("URL에서 프로필 이미지 다운로드 및 업로드 중 오류 발생:", error);
      throw new Error(`프로필 이미지를 다운로드 및 저장하는 중 오류가 발생했습니다: ${error.message}`);
    }
  }
}

export default UserProfilePhoto;