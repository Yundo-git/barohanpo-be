const express = require("express");
const router = express.Router();

// 우리가 방금 export한 이름과 동일하게 import
const { uploadMiddleware } = require("../../middlewares/upload.middleware");
const ProfilePhotoController = require("./profilePhoto.controller");

// ── Swagger 주석은 그대로 유지 ──

// 업로드(단일) — 미들웨어: uploadMiddleware (profileImage | file | image | photo 지원)
router.put(
  "/:user_id/photo/upload",
  uploadMiddleware,
  ProfilePhotoController.uploadProfilePhoto.bind(ProfilePhotoController)
);

// 조회(이미지 직접 응답, ETag/Last-Modified는 컨트롤러에서 설정)
router.get(
  "/:user_id/photo",
  ProfilePhotoController.getProfilePhoto.bind(ProfilePhotoController)
);

// 기본 이미지로 초기화
router.post(
  "/:user_id/photo/default",
  ProfilePhotoController.setDefaultProfilePhoto.bind(ProfilePhotoController)
);

module.exports = router;
