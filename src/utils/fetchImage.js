import axios from "axios";

/**
 * 원격 이미지 URL을 받아서 { mimeType, buffer } 반환
 */
async function fetchImageAsBuffer(url) {
  if (!url) throw new Error("Image URL is required");
  const res = await axios.get(url, { responseType: "arraybuffer" });

  // mime 타입은 카카오 응답 헤더의 content-type 사용
  const mimeType = res.headers["content-type"] || "application/octet-stream";

  return { mimeType, buffer: Buffer.from(res.data) };
}

export { fetchImageAsBuffer };
