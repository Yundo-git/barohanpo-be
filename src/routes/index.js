import express from "express";
import pharmacyRoutes from "../api/pharmacy/pharmacy.routes.js";

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: 서버 상태 확인
 *     responses:
 *       200:
 *         description: 서버가 정상 작동 중입니다.
 */

// 컨트롤러 가져오기
// import {
//   getAllExamples,
//   getExampleById,
// } from "../controllers/exampleController.js";

// router.get("/:id", getExampleById);

// 라우터정의
router.use("/pharmacy", pharmacyRoutes); //약국 관련 라우터
// router.use("/pha_user", pha_userRoutes); //약사 관련 라우터

export default router;
