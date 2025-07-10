import express from "express";
import { getAllpharmacy, getNearbypharmacy } from "./pharmacy.controller.js";
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Pharmacy
 *   description: 약국 관련 API
 */

/**
 * @swagger
 * /api/pharmacy:
 *   get:
 *     tags: [Pharmacy]
 *     summary: 전체 약국 목록 조회
 *     description: 데이터베이스에 저장된 모든 약국의 목록을 조회합니다.
 *     responses:
 *       200:
 *         description: 성공적으로 약국 목록을 가져왔습니다.
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
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pharmacy'
 */

/**
 * @swagger
 * /api/pharmacy/nearby:
 *   get:
 *     tags: [Pharmacy]
 *     summary: 근처 약국 조회
 *     description: 사용자의 현재 위치를 기반으로 근처 약국을 조회합니다.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: 사용자 위도
 *         example: 37.5665
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: 사용자 경도
 *         example: 126.9780
 *     responses:
 *       200:
 *         description: 성공적으로 근처 약국을 조회했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pharmacy'
 */

router.get("/", getAllpharmacy);
router.get("/nearby", getNearbypharmacy);

export default router;
