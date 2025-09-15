import winston from "winston";
import path from "path";
import { fileURLToPath } from 'url';
import config from "../config/config.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In CommonJS, __dirname is already available

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 로그 레벨 색상 설정
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

// 로그 포맷 설정
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

// 로그 저장 경로
const logDir = path.join(__dirname, "../../logs");

// 로거 옵션
const transports = [
  // 콘솔 출력
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),

  // 에러 로그 파일
  new winston.transports.File({
    filename: path.join(logDir, "error.log"),
    level: "error",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),

  // 전체 로그 파일
  new winston.transports.File({
    filename: path.join(logDir, "combined.log"),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// 로거 생성
const logger = winston.createLogger({
  level: config.nodeEnv === "development" ? "debug" : "info",
  levels,
  format,
  transports,
  exitOnError: false,
});

// 프로덕션 환경이 아닌 경우 파일에 로그를 저장하지 않음
if (config.nodeEnv !== "production") {
  logger.clear();
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export { logger };
