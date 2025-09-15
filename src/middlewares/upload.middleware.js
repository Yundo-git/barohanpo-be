// src/middlewares/upload.middleware.js
import { v4 as uuidv4 } from 'uuid';
import { put } from '@vercel/blob';
import multer from 'multer';
import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';

// ===== 공통 설정 =====
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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

// Vercel Blob 업로드 유틸 함수
const uploadToVercelBlob = async (file, prefix = "image") => {
  if (!file || !file.buffer) {
    logger.error("파일 객체 또는 버퍼가 없습니다.");
    return null;
  }
  
  const fileExtension = file.originalname.split('.').pop();
  const safeFilename = `${prefix}/${uuidv4()}.${fileExtension}`; // <-- 여기를 수정!

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

// ===== 프로필 이미지(단일) - Vercel Blob 업로드 =====
const uploadProfileImage = (req, res, next) => {
  singleMulter.fields([
    { name: "file", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return handleUploadError(err, res);

    let file = null;
    if (req.files) {
      const arr = req.files.file;
      if (Array.isArray(arr) && arr[0]) {
        file = arr[0];
      }
    }

    if (!file) {
      return next();
    }

    try {
      const photoUrl = await uploadToVercelBlob(file, "profile");
      req.uploadedUrls = [photoUrl];
      next();
    } catch (uploadError) {
      return res.status(500).json({ success: false, message: uploadError.message });
    }
  });
};

// ===== 리뷰 사진(단일) - Vercel Blob 업로드 =====
const uploadReviewPhotoSingle = (req, res, next) => {
  singleMulter.fields([
    { name: "photo", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return handleUploadError(err, res);

    let file = null;
    if (req.files) {
      for (const key of Object.keys(req.files)) {
        const arr = req.files[key];
        if (Array.isArray(arr) && arr[0]) {
          file = arr[0];
          break;
        }
      }
    }

    if (!file) {
      return next();
    }

    try {
      const photoUrl = await uploadToVercelBlob(file, "review-photo");
      req.uploadedUrls = [photoUrl];
      next();
    } catch (uploadError) {
      return res.status(500).json({ success: false, message: uploadError.message });
    }
  });
};

// ===== 리뷰 사진(다중 최대 3) - Vercel Blob 업로드 =====
const uploadReviewPhotos = (req, res, next) => {
  multiMulter.fields([
    { name: "photos", maxCount: 3 },
    { name: "images", maxCount: 3 },
    { name: "files", maxCount: 3 },
  ])(req, res, async (err) => {
    if (err) return handleUploadError(err, res);

    let mergedFiles = [];
    if (req.files) {
      mergedFiles = mergedFiles.concat(
        req.files.photos || [],
        req.files.images || [],
        req.files.files || []
      );
    }
    
    if (mergedFiles.length === 0) {
      return next();
    }

    try {
      const uploadPromises = mergedFiles.map(file => uploadToVercelBlob(file, "review-photos"));
      const uploadedUrls = await Promise.all(uploadPromises);
      req.uploadedUrls = uploadedUrls;
      next();
    } catch (uploadError) {
      return res.status(500).json({ success: false, message: uploadError.message });
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