import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import xss from "xss-clean";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import globalRoutes from "./routes/index.js";

import config from "./config/config.js";
import logger from "./utils/logger.js";
import errorHandler, { notFoundHandler } from "./middlewares/errorHandler.js";

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1) GLOBAL MIDDLEWARES
// 보안 HTTP 헤더 설정
app.use(helmet());

// 개발 환경 로깅
if (config.nodeEnv === "development") {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// CORS 설정
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// 요청 본문 파싱
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 데이터 보안
app.use(xss()); // XSS 공격 방지
app.use(hpp()); // HTTP 파라미터 오염 방지

// 압축
app.use(compression());

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, "public")));

// API 요청 제한
const limiter = rateLimit({
  max: 100, // 100개의 요청
  windowMs: 60 * 60 * 1000, // 1시간
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// 2) ROUTES
// 상태 확인 엔드포인트
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: config.api.version,
  });
});

// Mount global API routes
app.use("/api", globalRoutes);

// API 문서
app.get("/api-docs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "api-docs.html"));
});

// 3) ERROR HANDLING
// 존재하지 않는 라우트 처리
app.all("*", notFoundHandler);

// 전역 에러 핸들러
app.use(errorHandler);

export default app;
