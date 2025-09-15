// profilePhoto.controller.js
import UserProfilePhoto from "./userProfilePhoto.model.js";
import { logger } from "../../utils/logger.js";

class ProfilePhotoController {
  /**
   * 프로필 사진을 업로드합니다. (Vercel Blob URL 저장)
   */
  static async uploadProfilePhoto(req, res, next) {
    try {
      const { user_id: userId } = req.params;
      
      // 이 부분을 수정해야 합니다.
      const photoUrl = req.uploadedUrls ? req.uploadedUrls[0] : null;
  
      // 파일이 미들웨어에서 업로드되지 않은 경우
      if (!photoUrl) {
        return res.status(400).json({
          success: false,
          message: "프로필 이미지 파일이 필요합니다.",
        });
      }
  
      // DB에 URL만 저장
      const result = await UserProfilePhoto.upsertProfilePhoto(userId, photoUrl);
  
      res.status(200).json({
        success: true,
        data: {
          updatedAt: new Date(),
          photoUrl: result.photoUrl,
        },
      });
    } catch (error) {
      logger.error("프로필 사진 업로드 중 오류:", error);
      next(error);
    }
  }static async uploadProfilePhoto(req, res, next) {
    try {
      const { user_id: userId } = req.params;
      
      // 이 부분을 수정해야 합니다.
      const photoUrl = req.uploadedUrls ? req.uploadedUrls[0] : null;
  
      // 파일이 미들웨어에서 업로드되지 않은 경우
      if (!photoUrl) {
        return res.status(400).json({
          success: false,
          message: "프로필 이미지 파일이 필요합니다.",
        });
      }
  
      // DB에 URL만 저장
      const result = await UserProfilePhoto.upsertProfilePhoto(userId, photoUrl);
  
      res.status(200).json({
        success: true,
        data: {
          updatedAt: new Date(),
          photoUrl: result.photoUrl,
        },
      });
    } catch (error) {
      logger.error("프로필 사진 업로드 중 오류:", error);
      next(error);
    }
  }

  /**
   * 프로필 사진 URL을 조회합니다.
   */
  static async getProfilePhoto(req, res, next) {
    try {
      const { user_id: userId } = req.params;
      const photoUrl = await UserProfilePhoto.getProfilePhotoUrl(userId);

      if (!photoUrl) {
        return res.status(404).json({
          success: false,
          message: "프로필 사진을 찾을 수 없습니다.",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          photoUrl,
        },
      });
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

      if (req.user.id !== parseInt(userId, 10) && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "자신의 프로필 사진만 수정할 수 있습니다.",
        });
      }

      const result = await UserProfilePhoto.createDefaultProfilePhoto(userId);

      res.status(200).json({
        success: true,
        data: {
          updatedAt: result.updatedAt,
          photoUrl: result.photoUrl,
        },
      });
    } catch (error) {
      logger.error("기본 프로필 이미지 설정 중 오류:", error);
      next(error);
    }
  }
}

export default ProfilePhotoController;