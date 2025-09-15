import express from "express";
const router = express.Router();

// Import with ES modules
import { uploadMiddleware } from "../../middlewares/upload.middleware.js";
import ProfilePhotoController from "./profilePhoto.controller.js";

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

export default router;
