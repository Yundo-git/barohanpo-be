const multer = require('multer');
const { createHash } = require('crypto');
const logger = require('../utils/logger');

// 파일 크기 제한 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 메모리 스토리지 설정
const storage = multer.memoryStorage();

// 파일 필터링 함수
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 형식만 업로드 가능합니다.');
    error.status = 400;
    return cb(error, false);
  }
  cb(null, true);
};

// Multer 미들웨어 생성
const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: fileFilter
});

// 프로필 이미지 업로드 미들웨어
const uploadProfileImage = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      logger.error('파일 업로드 오류:', err);
      
      // 파일 크기 초과 오류 처리
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: '파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.'
        });
      }
      
      // 파일 형식 오류 처리
      if (err.message.includes('지원하지 않는 파일 형식')) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      // 기타 오류 처리
      return res.status(500).json({
        success: false,
        message: '파일 업로드 중 오류가 발생했습니다.'
      });
    }
    
    // 파일이 없을 경우
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '업로드할 파일이 없습니다.'
      });
    }
    
    // 파일이 정상적으로 업로드된 경우
    next();
  });
};

// ETag 생성 함수
const generateETag = (data) => {
  const hash = createHash('md5').update(data).digest('hex');
  return `"${hash}"`;
};

// 캐시 관련 헤더 설정 미들웨어
const setCacheHeaders = (req, res, data, lastModified) => {
  const etag = generateETag(data);
  res.set('ETag', etag);
  res.set('Last-Modified', lastModified.toUTCString());
  
  // 캐시 제어 헤더 설정 (1시간 캐시)
  res.set('Cache-Control', 'public, max-age=3600');
  
  // 클라이언트 캐시 검증 (If-None-Match, If-Modified-Since)
  const clientETag = req.headers['if-none-match'];
  const clientModifiedSince = req.headers['if-modified-since'];
  
  if (clientETag && clientETag === etag) {
    return res.status(304).end();
  }
  
  if (clientModifiedSince) {
    const clientModifiedDate = new Date(clientModifiedSince);
    if (lastModified <= clientModifiedDate) {
      return res.status(304).end();
    }
  }
};

// Export the upload middleware and utilities
module.exports = {
  uploadMiddleware: upload.single('file'),
  setCacheHeaders
};
