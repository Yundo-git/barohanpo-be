import express from "express";
import pharmacyRoutes from "../api/pharmacy/pharmacy.routes.js";
import pha_userRoutes from "../api/pha_user/pha_user.routes.js";
import booksRoutes from "../api/reservation/reservation.routes.js";
import authRoutes from "../api/auth/auth.routes.js";
import reviewRoutes from "../api/review/review.routes.js";
import profileRoutes from "../api/profile/profile.routes.js";
import favoritesRoutes from "../api/favorites/favorites.routes.js";
// import kakaoRoutes from "../api/auth/kakao/kakao.routes.js";

const router = express.Router();

// 라우터정의
router.use("/pharmacy", pharmacyRoutes); //약국 관련 라우터
router.use("/pha_user", pha_userRoutes); //약사 관련 라우터
router.use("/reservation", booksRoutes); //예약 관련 라우터
router.use("/auth", authRoutes); //회원 관련 라우터
router.use("/reviews", reviewRoutes); //리뷰 관련 라우터
router.use("/profile", profileRoutes); // 사용자 프로필 관련 라우터
router.use("/favorites", favoritesRoutes); // 찜 관련 라우터
// router.use("/auth/kakao", kakaoRoutes); // 카카오 로그인 관련 라우터

//env에 있는 API_PREFIX를 사용하여 라우터를 정의필요
export default router;
