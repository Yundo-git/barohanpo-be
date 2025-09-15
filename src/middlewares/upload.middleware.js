// src/middlewares/upload.middleware.js

// ... (기존 import 및 공통 설정 코드는 동일)
import { v4 as uuidv4 } from 'uuid';
import { put, del } from '@vercel/blob';
import multer from 'multer';
import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';
import UserProfilePhoto from '../api/profile/userProfilePhoto.model.js';


const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    const err = new Error("지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 형식만 업로드 가능합니다.");
    return cb(err, false);
  }
  cb(null, true);
};

const singleMulter = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
});

const multiMulter = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 3 },
  fileFilter,
});

const handleUploadError = (err, res) => {
  logger.error("파일 업로드 오류:", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다." });
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({ success: false, message: "최대 3개의 파일만 업로드 가능합니다." });
  }
  if (typeof err.message === "string" && err.message.includes("지원하지 않는 파일 형식")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: "파일 업로드 중 오류가 발생했습니다." });
};

// Vercel Blob 업로드 유틸 함수 (이전과 동일)
const uploadToVercelBlob = async (file, prefix = "image") => {
  if (!file || !file.buffer) {
    logger.error("파일 객체 또는 버퍼가 없습니다.");
    return null;
  }
  
  const fileExtension = file.originalname.split('.').pop();
  const safeFilename = `${prefix}/${uuidv4()}.${fileExtension}`;

  logger.info(`Vercel Blob 업로드 시작: ${file.originalname}, MIME: ${file.mimetype}, Size: ${file.size}, New Filename: ${safeFilename}`);

  try {
    const blob = await put(safeFilename, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
    });
    return blob.url;
  } catch (error) {
    logger.error("Vercel Blob 업로드 중 오류 발생:", error);
    throw new Error("이미지 업로드에 실패했습니다.");
  }
};


// ===== 프로필 이미지 업로드 미들웨어 (이전과 동일) =====
const uploadProfileImage = (req, res, next) => {
  singleMulter.fields([{ name: "file", maxCount: 1 }])(req, res, async (err) => {
    if (err) return handleUploadError(err, res);
    
    // ... (기존 로직 동일)
    const userId = req.user?.user_id;
    if (!userId) {
      logger.error("User ID not found.");
      return res.status(401).json({ success: false, message: "Unauthorized: User ID not found." });
    }

    let file = null;
    if (req.files && req.files.file && Array.isArray(req.files.file) && req.files.file[0]) {
      logger.info("File uploaded.");
      file = req.files.file[0];
    }

    if (!file) {
      logger.info("No file uploaded.");
      return next();
    }

    try {
      const existingPhotoUrl = await UserProfilePhoto.getProfilePhotoUrl(userId);
      logger.info(`기존 프로필 사진 URL: ${existingPhotoUrl}`);

      const fileExtension = file.originalname.split('.').pop();
      const filename = `profile/${userId}-${uuidv4()}.${fileExtension}`;
      const newBlob = await put(filename, file.buffer, { access: 'public', contentType: file.mimetype });
      const newPhotoUrl = newBlob.url;
      logger.info(`새로운 프로필 사진 업로드 완료: ${newPhotoUrl}`);

      await UserProfilePhoto.upsertProfilePhoto(userId, newPhotoUrl);
      logger.info(`DB 업데이트 완료: ${newPhotoUrl}`);

      if (existingPhotoUrl && existingPhotoUrl.includes('vercel-storage.com')) {
        try {
          await del(existingPhotoUrl);
          logger.info(`기존 프로필 사진 삭제 완료: ${existingPhotoUrl}`);
        } catch (delError) {
          logger.error(`기존 사진 삭제 실패: ${existingPhotoUrl}`, delError);
        }
      }

      req.uploadedUrls = [newPhotoUrl];
      next();
    } catch (uploadError) {
      logger.error("파일 업로드 처리 중 오류 발생:", uploadError);
      return res.status(500).json({ success: false, message: uploadError.message });
    }
  });
};

// ===== 리뷰 생성 미들웨어: 단일 파일 업로드 (프론트엔드와 일치하도록 'file' 필드 사용) =====
const uploadReviewPhotoSingle = (req, res, next) => {
  singleMulter.single("file")(req, res, async (err) => {
    if (err) return handleUploadError(err, res);
    
    if (!req.file) {
      req.uploadedUrls = null;
      return next();
    }

    try {
      const uploadedUrl = await uploadToVercelBlob(req.file, "review_photos");
      req.uploadedUrls = [uploadedUrl];
      next();
    } catch (uploadError) {
      return res.status(500).json({ success: false, message: `Vercel Blob 업로드 실패: ${uploadError.message}` });
    }
  });
};

const uploadReviewPhotos = (req, res, next) => {
  multiMulter.fields([{ name: "photos", maxCount: 3 }])(req, res, async (err) => {
    if (err) return handleUploadError(err, res);

    let uploadedUrls = [];
    if (req.files && req.files.photos) {
      const files = req.files.photos;
      try {
        const uploadPromises = files.map(file => uploadToVercelBlob(file, "review_photos"));
        uploadedUrls = await Promise.all(uploadPromises);
        req.uploadedUrls = uploadedUrls;
        next();
      } catch (uploadError) {
        return res.status(500).json({ success: false, message: `Vercel Blob 업로드 실패: ${uploadError.message}` });
      }
    } else {
      req.uploadedUrls = [];
      next();
    }
  });
};

const generateETag = (data) => `"${createHash("md5").update(data).digest("hex")}"`;
const setCacheHeaders = (req, res, data, lastModified) => {
  const etag = generateETag(data);
  res.set("ETag", etag);
  res.set("Last-Modified", lastModified.toUTCString());
  res.set("Cache-Control", "public, max-age=3600");
  const inm = req.headers["if-none-match"];
  const ims = req.headers["if-modified-since"];
  if (inm && inm === etag) return res.status(304).end();
  if (ims) {
    const d = new Date(ims);
    if (lastModified <= d) return res.status(304).end();
  }
};

const base = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export {
  uploadProfileImage,
  uploadProfileImage as uploadMiddleware,
  uploadReviewPhotoSingle,
  uploadReviewPhotos,
  
  base,
  generateETag,
  setCacheHeaders,
};