const express = require("express");
const { signup, login, refreshToken, logout, getCurrentUser } = require("./auth.controller");
const { isAuthenticated } = require("../../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 사용자 인증 관련 API
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 사용자 이메일
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: 비밀번호 (8자 이상)
 *               name:
 *                 type: string
 *                 description: 사용자 이름
 *               phone:
 *                 type: string
 *                 description: 전화번호 (하이픈 제외)
 *     responses:
 *       200:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
router.post("/signup", signup);

// Public routes
router.post("/login", login);
router.post("/refresh-token", refreshToken);

// Protected routes (require authentication)
router.use(isAuthenticated);
router.get("/me", getCurrentUser);
router.post("/logout", logout);

// @swagger
// components:
//   schemas:
//     User:
//       type: object
//       properties:
//         id:
//           type: integer
//           description: 사용자 고유 ID
//         email:
//           type: string
//           format: email
//         name:
//           type: string
//         phone:
//           type: string
//         created_at:
//           type: string
//           format: date-time
//         updated_at:
//           type: string
//           format: date-time

export default router;
