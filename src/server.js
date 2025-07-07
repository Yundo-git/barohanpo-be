import app from "./app.js";
import dotenv from "dotenv";

// 환경 변수 설정
dotenv.config();

const PORT = process.env.PORT || 5001;

// 서버 시작
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);

  //   try {
  //     // query 함수를 사용하여 데이터베이스 쿼리 실행
  //     const [rows] = await query("SELECT * FROM company WHERE id = 1");
  //     console.log("Company data:", rows);
  //   } catch (error) {
  //     console.error("Database query error:", error);
  //   }
});
