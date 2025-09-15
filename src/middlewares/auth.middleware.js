import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { verifyToken } from '../config/jwt.config.js';

/**
 * 인증 미들웨어
 * 헤더의 Authorization 토큰 또는 쿠키의 accessToken을 검증합니다.
 */
const isAuthenticated = (req, res, next) => {
  // console.log("[Auth Middleware] Checking authentication for request:", req.method, req.originalUrl);
  try {
    // 헤더에서 토큰 추출 (Bearer 토큰 또는 쿠키에서)
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;
    // console.log("[Auth Middleware] Extracted token:", token);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
    }

    // 토큰 검증 (리프레시 토큰이 아닌지 확인)
    const { success, decoded, message } = verifyToken(token);
    
    if (!success || decoded.isRefreshToken) { 
      // console.log("[Auth Middleware] Token verification failed:", message);
      return res.status(401).json({
        success: false,
        message: message || '유효하지 않은 토큰입니다.'
      });
    }
    
    // 사용자 정보를 요청 객체에 저장
    req.user = decoded;
    // console.log("[Auth Middleware] User authenticated:", req.user);
    
    next();
  } catch (error) {
    // console.error("[Auth Middleware] Error verifying token:", error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다. 토큰을 갱신해주세요.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: '인증에 실패했습니다. 다시 로그인해주세요.'
    });
  }
};

/**
 * 관리자 권한 확인 미들웨어
 * isAuthenticated 미들웨어 이후에 사용해야 합니다.
 */
const isAdmin = (req, res, next) => {
  // console.log("[Auth Middleware] Checking admin role for user:", req.user);
  try {
    if (req.user && req.user.role === 'admin') {
      // console.log("[Auth Middleware] User is admin, allowing access.");
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.'
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '인증에 실패했습니다.'
    });
  }
};

/**
 * 역할 기반 접근 제어 미들웨어
 * @param {string[]} roles - 허용할 역할 배열
 */
const hasRole = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다.'
        });
      }

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: '접근 권한이 없습니다.'
        });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: '인증에 실패했습니다.'
      });
    }
  };
};

export { isAuthenticated, isAdmin, hasRole };;
