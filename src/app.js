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

// 1) CORS Configuration (should be at the top)
const corsOptions = {
  // Allow all origins in development, specific ones in production
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins and log them
    if (process.env.NODE_ENV !== 'production') {
      // console.log(`Allowing CORS for development origin: ${origin}`);
      return callback(null, true);
    }
    
    // In production, only allow specific origins
    const allowedOrigins = [
      'https://barohanpo-fe.vercel.app',
      'https://www.barohanpo.xyz',
      'https://barohanpo.xyz',
      'http://localhost:3000', // For local development
      'http://localhost:5000'  // For local API access
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if the origin matches the regex pattern for localhost with any port
    const localhostRegex = /^https?:\/\/localhost(:[0-9]+)?$/;
    if (localhostRegex.test(origin)) {
      return callback(null, true);
    }
    
    console.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  
  // Required for cookies, authorization headers with HTTPS
  credentials: true,
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  
  // Allowed request headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Accept-Encoding',
    'Accept-Language',
    'Cache-Control',
    'Pragma',
    'Connection',
    'DNT',
    'Origin',
    'Referer',
    'User-Agent',
    'If-None-Match',
    'If-Modified-Since',
    'Range' // For byte-range requests
  ],
  
  // Exposed headers
  exposedHeaders: [
    'Content-Length',
    'Content-Range',
    'ETag',
    'Last-Modified',
    'Cache-Control',
    'Content-Type',
    'Content-Disposition',
    'Authorization',
    'X-Refresh-Token',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  
  // Set max age for preflight requests (in seconds)
  maxAge: 86400, // 24 hours
  
  // Some legacy browsers (IE11, various SmartTVs) choke on 204
  optionsSuccessStatus: 200
};

// Apply CORS with the above configuration
app.use(cors(corsOptions));

// Handle preflight requests for all routes
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

// 1) General API rate limiting (applied to all routes by default)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: JSON.stringify({
    success: false,
    error: 'Too many requests, please try again later.'
  }),
  // Skip rate limiting for successful requests (status < 400)
  skipSuccessfulRequests: true,
  // Skip rate limiting for authenticated users with higher limits
  skip: (req) => req.user && req.user.role === 'admin',
});

// 2) Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: JSON.stringify({
    success: false,
    error: 'Too many login attempts, please try again later.'
  }),
  // Apply rate limiting to all requests, including successful ones
  skipSuccessfulRequests: false,
  // Skip rate limiting for whitelisted IPs (e.g., your office IP)
  skip: (req) => {
    const whitelist = ['127.0.0.1', '::1'];
    return whitelist.includes(req.ip);
  },
});

// 3) Apply rate limiting to specific routes
app.use('/api', apiLimiter); // Apply general rate limiting to all API routes
app.use('/api/auth/login', authLimiter); // Stricter rate limiting for login
app.use('/api/auth/signup', authLimiter); // Stricter rate limiting for signup
app.use('/api/auth/refresh-token', authLimiter); // Stricter rate limiting for token refresh

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
