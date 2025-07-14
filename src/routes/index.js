import express from "express";
import pharmacyRoutes from "../api/pharmacy/pharmacy.routes.js";
import pha_userRoutes from "../api/pha_user/pha_user.routes.js";
import booksRoutes from "../api/reservation/reservation.routes.js";

const router = express.Router();

// 컨트롤러 가져오기
// import {
//   getAllExamples,
//   getExampleById,
// } from "../controllers/exampleController.js";

// router.get("/:id", getExampleById);

// 라우터정의
router.use("/pharmacy", pharmacyRoutes); //약국 관련 라우터
router.use("/pha_user", pha_userRoutes); //약사 관련 라우터
router.use("/reservation", booksRoutes); //예약 관련 라우터

export default router;
