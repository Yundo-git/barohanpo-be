const express = require("express");
const router = express.Router();
const uploadProfileImage = require("../../middlewares/upload.middleware");
const ProfilePhotoController = require("./profilePhoto.controller");
const { isAuthenticated } = require("../../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: 사용자 프로필 관리
 */

/**
 * @swagger
 * /api/users/{id}/profile/photo:
 *   put:
 *     summary: 프로필 사진 업로드
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 프로필 이미지 파일 (최대 5MB, JPEG/PNG/WebP)
 *     responses:
 *       200:
 *         description: 프로필 사진 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     etag:
 *                       type: string
 *                       example: "1234567890"
 *       400:
 *         description: 잘못된 요청 (예: 지원하지 않는 파일 형식)
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (자신의 프로필만 수정 가능)
 *       413:
 *         description: 파일 크기 초과 (최대 5MB)
 *       500:
 *         description: 서버 오류
 */
// Upload profile photo route
router.put(
  "/:user_id/profile/photo",
  isAuthenticated,
  uploadProfileImage,
  ProfilePhotoController.uploadProfilePhoto.bind(ProfilePhotoController)
);

/**
 * @swagger
 * /api/users/{id}/profile/photo:
 *   get:
 *     summary: 프로필 사진 조회
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *       - in: header
 *         name: If-None-Match
 *         schema:
 *           type: string
 *         description: 이전에 받은 ETag (캐시 유효성 검사용)
 *       - in: header
 *         name: If-Modified-Since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 이전에 받은 Last-Modified (캐시 유효성 검사용)
 *     responses:
 *       200:
 *         description: 프로필 사진 조회 성공
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       304:
 *         description: 캐시된 버전이 최신입니다. (Not Modified)
 *       404:
 *         description: 프로필 사진을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get(
  "/:user_id/profile/photo",
  ProfilePhotoController.getProfilePhoto.bind(ProfilePhotoController)
);

/**
 * @swagger
 * /api/users/{id}/profile/photo/default:
 *   post:
 *     summary: 기본 프로필 이미지로 초기화
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 기본 프로필 이미지로 초기화 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     etag:
 *                       type: string
 *                       example: "1234567890"
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (자신의 프로필만 수정 가능)
 *       500:
 *         description: 서버 오류
 */
router.post(
  "/:user_id/profile/photo/default",
  isAuthenticated,
  ProfilePhotoController.setDefaultProfilePhoto.bind(ProfilePhotoController)
);

module.exports = router;
