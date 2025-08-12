const app = require("./app");
const dotenv = require("dotenv");
const slotManager = require("./utils/slotManager");

// 환경 변수 설정
dotenv.config();

const PORT = process.env.PORT || 5000;

// 서버 시작
const server = app.listen(PORT, "0.0.0.0", async () => {
  console.log(`\nServer is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log("Swagger 문서: http://localhost:5000/api-docs");
  
  // 슬롯 매니저 시작 (7일치 슬롯 유지)
  try {
    await slotManager.start(7);
    console.log('Slot manager started successfully');
  } catch (error) {
    console.error('Failed to start slot manager:', error);
  }
});


const shutdown = async () => {
  console.log('Shutting down gracefully...');
  
  // 슬롯 매니저 정리
  slotManager.stop();
  
  // 서버 종료
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // 5초 후 강제 종료
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

// 시그널 핸들러 등록
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
