// Load environment variables first
const dotenv = require("dotenv");
const path = require('path');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Validate required environment variables
const requiredEnvVars = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error(`Please check your .env file at: ${envPath}`);
  process.exit(1);
}

const app = require("./app");
const slotManager = require("./utils/slotManager");

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
