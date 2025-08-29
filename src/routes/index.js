const express = require("express");
const pharmacyRoutes = require("../api/pharmacy/pharmacy.routes");
const pha_userRoutes = require("../api/pha_user/pha_user.routes");
const booksRoutes = require("../api/reservation/reservation.routes");
const authRoutes = require("../api/auth/auth.routes");
const reviewRoutes = require("../api/review/review.routes");
const profileRoutes = require("../api/profile/profile.routes");
const router = express.Router();

// 라우터정의
router.use("/pharmacy", pharmacyRoutes); //약국 관련 라우터
router.use("/pha_user", pha_userRoutes); //약사 관련 라우터
router.use("/reservation", booksRoutes); //예약 관련 라우터
router.use("/auth", authRoutes); //회원 관련 라우터
router.use("/review", reviewRoutes); //리뷰 관련 라우터
router.use("/api/users", profileRoutes); // 사용자 프로필 관련 라우터

//env에 있는 API_PREFIX를 사용하여 라우터를 정의필요
module.exports = router;
