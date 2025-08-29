const UserProfilePhoto = require("./userProfilePhoto.Model");
const { setCacheHeaders } = require("../../middlewares/upload.middleware");
const logger = require("../../utils/logger");

class ProfilePhotoController {
  /**
   * 프로필 사진을 업로드합니다.
   */
  static async uploadProfilePhoto(req, res, next) {
    console.log("req.user", req.user);
    console.log("req.params", req.params);
    console.log("req.file", req.file);

    try {
      const { user_id: userId } = req.params;
      const { file } = req;

      // 권한 확인 (자신의 프로필만 수정 가능)
      if (req.user.id !== parseInt(userId) && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "자신의 프로필 사진만 수정할 수 있습니다.",
        });
      }

      // 파일이 없는 경우
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "프로필 이미지 파일이 필요합니다.",
        });
      }

      // 프로필 사진 저장
      const result = await UserProfilePhoto.upsertProfilePhoto(
        userId,
        file.mimetype,
        file.buffer
      );

      // 응답
      res.status(200).json({
        success: true,
        data: {
          updatedAt: result.updatedAt,
          etag: `"${Date.now()}"`, // 간단한 ETag 생성 (실제로는 해시 사용 권장)
        },
      });
    } catch (error) {
      logger.error("프로필 사진 업로드 중 오류:", error);
      next(error);
    }
  }

  /**
   * 프로필 사진을 조회합니다.
   */
  static async getProfilePhoto(req, res, next) {
    try {
      const { user_id: userId } = req.params;

      // 프로필 사진 조회
      const photo = await UserProfilePhoto.getProfilePhoto(userId);

      // 프로필 사진이 없는 경우 404 응답
      if (!photo || !photo.photo_blob) {
        return res.status(404).json({
          success: false,
          message: "프로필 사진을 찾을 수 없습니다.",
        });
      }

      // 캐시 헤더 설정
      const lastModified = photo.updated_at || new Date();
      setCacheHeaders(req, res, photo.photo_blob, lastModified);

      // 이미지 응답
      res.set("Content-Type", photo.mime_type);
      res.send(photo.photo_blob);
    } catch (error) {
      logger.error("프로필 사진 조회 중 오류:", error);
      next(error);
    }
  }

  /**
   * 기본 프로필 이미지로 초기화합니다.
   */
  static async setDefaultProfilePhoto(req, res, next) {
    try {
      const { user_id: userId } = req.params;

      // 권한 확인 (자신의 프로필만 수정 가능)
      if (req.user.id !== parseInt(userId) && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "자신의 프로필 사진만 수정할 수 있습니다.",
        });
      }

      // 기본 프로필 이미지 설정
      const result = await UserProfilePhoto.createDefaultProfilePhoto(userId);

      // 응답
      res.status(200).json({
        success: true,
        data: {
          updatedAt: result.updatedAt,
          etag: `"${Date.now()}"`, // 간단한 ETag 생성
        },
      });
    } catch (error) {
      logger.error("기본 프로필 이미지 설정 중 오류:", error);
      next(error);
    }
  }
}

module.exports = ProfilePhotoController;
