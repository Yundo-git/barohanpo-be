// 환경 변수 로드
const dotenv = require('dotenv');
dotenv.config();

// 데이터베이스 연결 설정
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'barohanpo',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10초
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+09:00', // 한국 시간대 설정
  charset: 'utf8mb4',
  multipleStatements: true,
  dateStrings: true,
  typeCast: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  debug: process.env.NODE_ENV === 'development',
  trace: process.env.NODE_ENV === 'development',
};

// 서버 설정
const serverConfig = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
};

// JWT 설정
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// CORS 설정
const corsConfig = {
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
};

// API 설정
const apiConfig = {
  prefix: '/api',
  version: 'v1',
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
};

// 로깅 설정
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.LOG_FILE || 'logs/app.log',
  errorFile: process.env.ERROR_LOG_FILE || 'logs/error.log',
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '14d',
};

module.exports = {
  ...serverConfig,
  db: dbConfig,
  jwt: jwtConfig,
  cors: corsConfig,
  api: apiConfig,
  logger: loggerConfig,
};
