# 프로필 사진 관리 API

이 문서는 사용자 프로필 사진을 관리하기 위한 API에 대한 설명입니다.

## API 엔드포인트

### 1. 프로필 사진 업로드

```
PUT /api/users/:id/profile/photo
```

**요청 헤더:**
- `Authorization`: Bearer 토큰 (인증 필요)
- `Content-Type`: multipart/form-data

**요청 본문:**
- `profileImage`: 업로드할 이미지 파일 (최대 5MB, JPEG/PNG/WebP)

**응답 예시 (성공 시 200 OK):**
```json
{
  "success": true,
  "data": {
    "updatedAt": "2025-08-29T15:10:50.000Z",
    "etag": "\"1234567890\""
  }
}
```

### 2. 프로필 사진 조회

```
GET /api/users/:id/profile/photo
```

**응답 헤더:**
- `Content-Type`: 이미지 MIME 타입 (예: image/jpeg)
- `ETag`: 리소스 버전 식별자 (캐시 유효성 검사용)
- `Cache-Control`: 캐싱 정책
- `Last-Modified`: 마지막 수정 시간

**응답 본문:**
- 이미지 바이너리 데이터

### 3. 기본 프로필 이미지로 설정

```
POST /api/users/:id/profile/photo/default
```

**요청 헤더:**
- `Authorization`: Bearer 토큰 (인증 필요)

**응답 예시 (성공 시 200 OK):**
```json
{
  "success": true,
  "data": {
    "updatedAt": "2025-08-29T15:10:50.000Z",
    "etag": "\"1234567890\""
  }
}
```

## 에러 응답

### 400 Bad Request
- 잘못된 파일 형식
- 필수 필드 누락

### 401 Unauthorized
- 인증 실패
- 유효하지 않은 토큰

### 403 Forbidden
- 권한 없음 (자신의 프로필만 수정 가능)

### 404 Not Found
- 프로필 사진을 찾을 수 없음

### 413 Payload Too Large
- 파일 크기 초과 (최대 5MB)

## 캐싱 전략

프로필 사진 조회 시 다음 헤더를 사용하여 캐싱이 구현되어 있습니다:

- `ETag`: 이미지 내용의 해시값
- `Last-Modified`: 이미지 마지막 수정 시간
- `Cache-Control: public, max-age=86400` (24시간 캐시)

클라이언트는 `If-None-Match`와 `If-Modified-Since` 헤더를 사용하여 캐시 유효성 검사를 할 수 있습니다.

## 데이터베이스 스키마

```sql
CREATE TABLE user_profile_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  photo_blob LONGBLOB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 프로필 사진 정보';
```

## 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `FRONT_PUBLIC_BASE_URL` | 프론트엔드 기본 URL | `http://localhost:3000` |
| `DEFAULT_PROFILE_IMAGE_PATH` | 기본 프로필 이미지 경로 | `./assets/sample_profile.jpeg` |
| `MAX_FILE_SIZE` | 최대 파일 크기 (바이트) | `5242880` (5MB) |
| `ALLOWED_FILE_TYPES` | 허용되는 파일 MIME 타입 | `image/jpeg,image/png,image/webp` |

## 테스트

1. 프로필 사진 업로드 테스트:
```bash
curl -X PUT http://localhost:3000/api/users/1/profile/photo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "profileImage=@/path/to/your/photo.jpg"
```

2. 프로필 사진 조회 테스트:
```bash
curl -I http://localhost:3000/api/users/1/profile/photo
```

3. 기본 프로필 이미지로 설정 테스트:
```bash
curl -X POST http://localhost:3000/api/users/1/profile/photo/default \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
