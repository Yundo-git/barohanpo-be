const app = require("./app");
const dotenv = require("dotenv");
const { initSlotGenerator } = require("./utils/initSlotGenerator");

// 환경 변수 설정
dotenv.config();

const PORT = process.env.PORT || 5000;

// 서버 시작
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
  console.log("Swagger 문서: http://localhost:5000/api-docs");
});

//예약슬롯생성
initSlotGenerator();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated!");
  });
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
