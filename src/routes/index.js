import express from "express";
import pharmacyRoutes from "../api/pharmacy/pharmacy.routes.js";
import pha_userRoutes from "../api/pha_user/pha_user.routes.js";
import booksRoutes from "../api/reservation/reservation.routes.js";
import authRoutes from "../api/auth/auth.route.js";

const router = express.Router();

// 라우터정의
router.use("/pharmacy", pharmacyRoutes); //약국 관련 라우터
router.use("/pha_user", pha_userRoutes); //약사 관련 라우터
router.use("/reservation", booksRoutes); //예약 관련 라우터
router.use("/auth", authRoutes); //회원 관련 라우터

export default router;
