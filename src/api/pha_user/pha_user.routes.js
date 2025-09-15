import { Router } from "express";
import { getAllpha_user, getpha_userById } from "./pha_user.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Pharmacy Users
 *   description: 약사 유저 정보 조회
 */

/**
 * @swagger
 * /api/pha_users:
 *   get:
 *     summary: 전체 약사 목록 조회
 *     tags: [Pharmacy Users]
 *     responses:
 *       200:
 *         description: 성공적으로 약사 목록을 가져왔습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       p_id:
 *                         type: integer
 *                         example: 1
 *                       id:
 *                         type: string
 *                         example: "test@test.com"
 *                       p_name:
 *                         type: string
 *                         example: "김약사"
 *                       number:
 *                         type: number
 *                         example: "010-1234-5678"
 *
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Error message describing the issue"
 */
router.get("/", getAllpha_user);
router.get("/:p_id", getpha_userById);

export default router;
