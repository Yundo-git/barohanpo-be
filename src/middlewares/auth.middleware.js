import jwt from 'jsonwebtoken';
import config from '../config/config.js';

/**
 * 인증 미들웨어
 * 헤더의 Authorization 토큰을 검증합니다.
 */
export const isAuthenticated = (req, res, next) => {
  try {
    // 헤더에서 토큰 추출
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.'
    });
  }
};

/**
 * 관리자 권한 확인 미들웨어
 * isAuthenticated 미들웨어 이후에 사용해야 합니다.
 */
export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 역할 기반 접근 제어 미들웨어
 * @param {string[]} roles - 허용할 역할 배열
 */
export const hasRole = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: '접근 권한이 없습니다.'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
