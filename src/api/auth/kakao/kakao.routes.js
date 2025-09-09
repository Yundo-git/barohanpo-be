// api/auth/kakao/kakao.routes.js
const router = require("express").Router();
console.log("[kakao.routes] loaded"); // 서버 부팅 시 1회 출력
const { redirectToKakaoLogin, kakaoCallback } = require("./kakao.controller");

router.use((req, _res, next) => {
  console.log("[kakao.routes] hit:", req.method, req.originalUrl);
  next();
});
//asdf
router.get("/login", (req, res, next) => {
  console.log("[kakao.routes] /login handler");
  return redirectToKakaoLogin(req, res, next);
});
router.get("/callback", (req, res, next) => {
  console.log("[kakao.routes] /callback handler");
  return kakaoCallback(req, res, next);
});

module.exports = router;
