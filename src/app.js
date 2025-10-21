import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import xss from "xss-clean";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import globalRoutes from "./routes/index.js";
import swaggerSpec from "./config/swagger.js";
import config from "./config/config.js";
import { logger } from "./utils/logger.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1) CORS 설정 (가장 상단에 위치해야 함)
const corsOptions = {
  // 개발 환경에서는 모든 오리진 허용, 프로덕션에서는 특정 오리진만 허용
  origin: (origin, callback) => {
    // 오리진이 없는 요청 허용 (모바일 앱, curl, postman 등)
    if (!origin) return callback(null, true);
    
    // 개발 환경에서는 모든 오리진을 허용하고 로깅
    if (process.env.NODE_ENV !== 'production') {
      // console.log(`Allowing CORS for development origin: ${origin}`);
      return callback(null, true);
    }
    
    // 프로덕션 환경에서는 특정 오리진만 허용
   const allowedOrigins = [
      "http://localhost:3000",
      "https://barohanpo.xyz",
      "https://barohanpo-fe.vercel.app", // 프론트엔드 Vercel 도메인
    ];
   // origin이 없는 경우(같은 도메인) 또는 허용된 도메인인 경우
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // 로컬호스트의 임의 포트에 대한 정규식 패턴 일치 확인
    const localhostRegex = /^https?:\/\/localhost(:[0-9]+)?$/;
    if (localhostRegex.test(origin)) {
      return callback(null, true);
    }
    
    console.log("❌ CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  
  // 쿠키, HTTPS 인증 헤더에 필요
  credentials: true,
  
  // 허용된 HTTP 메소드
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  
  // 허용된 요청 헤더
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  
  // 노출할 헤더
  exposedHeaders: [
    "Content-Length",
    "Content-Range",
    "ETag",
    "Last-Modified",
    "Cache-Control",
    "Content-Type",
    "Content-Disposition",
    "Authorization",
    "X-Refresh-Token",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
    "set-cookie"
  ],
  
  // 프리플라이트 요청의 최대 유효 시간(초 단위)
  maxAge: 86400, // 24 hours
  
  // 일부 구형 브라우저(IE11, 일부 스마트TV)는 204 상태 코드에서 문제가 발생할 수 있음
  optionsSuccessStatus: 200
};

// 위 설정으로 CORS 미들웨어 적용
app.use(cors(corsOptions));

// 모든 라우트에 대한 프리플라이트 요청 처리
app.options('*', cors(corsOptions));

// 2) Swagger UI (CORS 다음에 위치)
app.use(
  "/api-docs",
  (req, res, next) => {
    console.log("✅ Swagger 요청 감지됨:", req.originalUrl);
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "BaroHanpo API 문서",
  })
);

// 3) 기타 미들웨어

// 개발 환경 로깅
if (config.nodeEnv === "development") {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, "public")));

// 요청 본문 파싱
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 보안 관련 미들웨어
app.use(
  helmet({
    contentSecurityPolicy: false, // Swagger UI 호환성을 위해 비활성화
    crossOriginEmbedderPolicy: false,
  })
);

app.use(xss());
app.use(hpp());
app.use(compression());

// 1) 일반 API 요청 제한 (기본적으로 모든 라우트에 적용)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 각 IP당 15분당 100회 요청 제한
  standardHeaders: true, // `RateLimit-*` 헤더에 요청 제한 정보 반환
  legacyHeaders: false, // `X-RateLimit-*` 헤더 비활성화
  // 요청 제한에 대한 응답 메시지
  message: JSON.stringify({
    success: false,
    error: '요청 제한 초과, 나중에 다시 시도하세요.'
  }),
  // 성공한 요청(상태 코드 < 400)은 요청 제한에서 제외
  skipSuccessfulRequests: true,
  // 관리자 권한이 있는 인증된 사용자는 요청 제한에서 제외
  skip: (req) => req.user && req.user.role === 'admin',
});

// 2) 인증 엔드포인트에 대한 더 엄격한 요청 제한
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // 인증 엔드포인트에 대해 IP당 15분당 10회 요청 제한
  standardHeaders: true,
  legacyHeaders: false,
  // 요청 제한에 대한 응답 메시지
  message: JSON.stringify({
    success: false,
    error: 'Too many login attempts, please try again later.'
  }),
  // 성공한 요청을 포함한 모든 요청에 요청 제한 적용
  skipSuccessfulRequests: false,
  // 화이트리스트에 있는 IP는 요청 제한에서 제외 (예: 사무실 IP)
  skip: (req) => {
    const whitelist = ['127.0.0.1', '::1'];
    return whitelist.includes(req.ip);
  },
});

// 3) 특정 라우트에 요청 제한 적용
app.use('/api', apiLimiter); // 모든 API 라우트에 일반 요청 제한 적용
app.use('/api/auth/login', authLimiter); // 로그인에 더 엄격한 요청 제한
app.use('/api/auth/signup', authLimiter); // 회원가입에 더 엄격한 요청 제한
app.use('/api/auth/refresh-token', authLimiter); // 토큰 갱신에 더 엄격한 요청 제한

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

// Mount global API routes (가장 마지막에 위치)
app.use("/api", globalRoutes);

// 3) ERROR HANDLING
// 존재하지 않는 라우트 처리
app.all("*", notFoundHandler);

// 전역 에러 핸들러
app.use(errorHandler);

//스웨거 라우터 추가
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
