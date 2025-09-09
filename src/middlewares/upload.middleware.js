const multer = require("multer");
const { createHash } = require("crypto");
const logger = require("../utils/logger");

// ===== 공통 설정 =====
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    const err = new Error(
      "지원하지 않는 파일 형식입니다. JPEG, PNG, WebP 형식만 업로드 가능합니다."
    );
    err.status = 400;
    return cb(err, false);
  }
  cb(null, true);
};

const base = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});
const single = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
});
const multi = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 3 },
  fileFilter,
});

const handleUploadError = (err, res) => {
  logger?.error?.("파일 업로드 오류:", err);
  if (err.code === "LIMIT_FILE_SIZE")
    return res
      .status(413)
      .json({
        success: false,
        message: "파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.",
      });
  if (err.code === "LIMIT_FILE_COUNT")
    return res
      .status(400)
      .json({
        success: false,
        message: "최대 3개의 파일만 업로드 가능합니다.",
      });
  if (
    typeof err.message === "string" &&
    err.message.includes("지원하지 않는 파일 형식")
  )
    return res.status(400).json({ success: false, message: err.message });
  return res
    .status(500)
    .json({ success: false, message: "파일 업로드 중 오류가 발생했습니다." });
};

// ===== 프로필 이미지(단일) — 기본 필드: profileImage (호환: file | image | photo) =====
const uploadProfileImage = (req, res, next) => {
  single.fields([
    { name: "profileImage", maxCount: 1 }, // Swagger 기본
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return handleUploadError(err, res);
    if (req.files) {
      for (const key of Object.keys(req.files)) {
        const arr = req.files[key];
        if (Array.isArray(arr) && arr[0]) {
          req.file = arr[0];
          break;
        }
      }
    }
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "업로드할 파일이 없습니다." });
    next();
  });
};

// 과거 코드 호환용 alias (라우터에서 uploadMiddleware로 import해도 됨)
const uploadMiddleware = uploadProfileImage;

// ===== 리뷰 사진(단일) — 허용 필드: photo | image | file =====
const uploadReviewPhotoSingle = (req, res, next) => {
  single.fields([
    { name: "photo", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return handleUploadError(err, res);
    if (req.files) {
      for (const key of Object.keys(req.files)) {
        const arr = req.files[key];
        if (Array.isArray(arr) && arr[0]) {
          req.file = arr[0];
          break;
        }
      }
    }
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "업로드할 파일이 없습니다." });
    next();
  });
};

// ===== 리뷰 사진(다중 최대 3) — 허용 필드: photos | images | files =====
const uploadReviewPhotos = (req, res, next) => {
  multi.fields([
    { name: "photos", maxCount: 3 },
    { name: "images", maxCount: 3 },
    { name: "files", maxCount: 3 },
  ])(req, res, (err) => {
    if (err) return handleUploadError(err, res);
    let merged = [];
    if (req.files) {
      merged = merged.concat(
        req.files.photos || [],
        req.files.images || [],
        req.files.files || []
      );
    }
    if (merged.length > 3)
      return res
        .status(400)
        .json({
          success: false,
          message: "최대 3개의 파일만 업로드 가능합니다.",
        });
    req.files = merged; // 컨트롤러에서 배열로 사용
    next();
  });
};

// ===== 캐시 유틸 =====
const generateETag = (data) =>
  `"${createHash("md5").update(data).digest("hex")}"`;
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

module.exports = {
  // 프로필
  uploadProfileImage,
  uploadMiddleware, // ← 라우터에서 이 이름으로 사용 가능(호환)
  // 리뷰
  uploadReviewPhotoSingle,
  uploadReviewPhotos,
  // 선택 유틸
  base,
  generateETag,
  setCacheHeaders,
};
