import logger from '../utils/logger.js';

/**
 * 에러 핸들링 미들웨어
 * @param {Error} err - 에러 객체
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const errorHandler = (err, req, res, next) => {
  // 에러 로깅
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  // 상태 코드 설정
  const statusCode = err.statusCode || 500;
  
  // 에러 응답 객체
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      name: err.name
    })
  };

  // 유효성 검사 에러인 경우 추가 정보 포함
  if (err.name === 'ValidationError') {
    errorResponse.errors = err.errors;
    errorResponse.message = '유효성 검사 실패';
  }

  // JWT 인증 에러
  if (err.name === 'JsonWebTokenError') {
    errorResponse.message = '유효하지 않은 토큰입니다.';
  }

  // 토큰 만료 에러
  if (err.name === 'TokenExpiredError') {
    errorResponse.message = '토큰이 만료되었습니다.';
  }

  // 응답 전송
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 에러 핸들러
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export default errorHandler;
