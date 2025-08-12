const express = require("express");
const pharmacyRoutes = require("../api/pharmacy/pharmacy.routes");
const pha_userRoutes = require("../api/pha_user/pha_user.routes");
const booksRoutes = require("../api/reservation/reservation.routes");
const authRoutes = require("../api/auth/auth.routes");

const router = express.Router();

// 라우터정의
router.use("/pharmacy", pharmacyRoutes); //약국 관련 라우터
router.use("/pha_user", pha_userRoutes); //약사 관련 라우터
router.use("/reservation", booksRoutes); //예약 관련 라우터
router.use("/auth", authRoutes); //회원 관련 라우터

module.exports = router;
