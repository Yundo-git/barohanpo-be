const db = require("../../config/database");
const logger = require("../../utils/logger");

class UserProfilePhoto {
  /**
   * 사용자 프로필 사진을 생성하거나 업데이트합니다.
   * @param {number} userId - 사용자 ID
   * @param {string} mimeType - 이미지 MIME 타입 (예: 'image/jpeg')
   * @param {Buffer} photoData - 이미지 바이너리 데이터
   * @returns {Promise<Object>} 업데이트된 프로필 사진 정보
   */
  static async upsertProfilePhoto(userId, mimeType, photoData) {
    const sql = `
      INSERT INTO user_profile_photos (user_id, mime_type, photo_blob)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        mime_type = VALUES(mime_type), 
        photo_blob = VALUES(photo_blob)
    `;

    try {
      const [result] = await db.execute(sql, [userId, mimeType, photoData]);
      return {
        id: result.insertId || userId, // ON DUPLICATE KEY UPDATE 시 insertId가 없을 수 있으므로 userId 반환
        userId,
        mimeType,
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error("프로필 사진 저장 중 오류 발생:", error);
      throw new Error("프로필 사진을 저장하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 사용자 프로필 사진을 조회합니다.
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object|null>} 프로필 사진 정보 (없으면 null)
   */
  static async getProfilePhoto(userId) {
    const sql = `
      SELECT mime_type, photo_blob
      FROM user_profile_photos 
      WHERE user_id = ? 
      LIMIT 1
    `;

    try {
      const [rows] = await db.execute(sql, [userId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error("프로필 사진 조회 중 오류 발생:", error);
      throw new Error("프로필 사진을 조회하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * 기본 프로필 이미지를 생성합니다.
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object>} 생성된 프로필 사진 정보
   */
  static async createDefaultProfilePhoto(userId) {
    // 환경변수에서 기본 이미지 경로 가져오기
    const defaultImagePath =
      process.env.DEFAULT_PROFILE_IMAGE_PATH || "./assets/sample_profile.jpeg";

    try {
      // 기본 이미지 파일 읽기
      const fs = require("fs").promises;
      const photoData = await fs.readFile(defaultImagePath);

      // MIME 타입 결정 (기본값: jpeg)
      const mimeType = "image/jpeg";

      // 프로필 사진 저장
      return await this.upsertProfilePhoto(userId, mimeType, photoData);
    } catch (error) {
      logger.error("기본 프로필 이미지 생성 중 오류 발생:", error);
      // 기본 이미지 생성 실패 시 상위로 에러 전파
      throw new Error("기본 프로필 이미지를 생성하는 중 오류가 발생했습니다.");
    }
  }

  /**
   * URL에서 이미지를 다운로드하여 프로필 사진으로 저장합니다.
   * @param {number} userId - 사용자 ID
   * @param {string} imageUrl - 다운로드할 이미지 URL
   * @returns {Promise<Object>} 저장된 프로필 사진 정보
   */
  static async createProfilePhotoFromUrl(userId, imageUrl) {
    try {
      const fetch = (await import("node-fetch")).default;
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`이미지 다운로드 실패: ${response.statusText}`);
      }

      const photoData = await response.buffer();
      const mimeType = response.headers.get("content-type");

      if (!mimeType || !mimeType.startsWith("image/")) {
        throw new Error("유효한 이미지 파일이 아닙니다.");
      }

      // 지원하는 이미지 형식인지 확인
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedMimeTypes.includes(mimeType)) {
        throw new Error(
          "지원하지 않는 이미지 형식입니다. JPEG, PNG, WebP 형식만 지원합니다."
        );
      }

      // 프로필 사진 저장
      return await this.upsertProfilePhoto(userId, mimeType, photoData);
    } catch (error) {
      logger.error("URL에서 프로필 이미지 다운로드 중 오류 발생:", error);
      throw new Error(
        `프로필 이미지를 다운로드하는 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }
}

module.exports = UserProfilePhoto;
