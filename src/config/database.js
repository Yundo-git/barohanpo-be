import mysql from "mysql2/promise";
import config from "./config.js";
import { logger } from "../utils/logger.js";

// MySQL 연결 풀 생성
const pool = mysql.createPool({
  ...config.db,
  debug: false,
  trace: false,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// 연결 풀 이벤트 리스너
pool.on("acquire", (connection) => {
  logger.debug(`🔌 Connection ${connection.threadId} acquired`);
});

pool.on("release", (connection) => {
  logger.debug(`🔌 Connection ${connection.threadId} released`);
});

pool.on("enqueue", () => {
  logger.debug("🔌 Waiting for available connection slot");
});

// 연결 테스트
// const testConnection = async () => {
//   let connection;
//   try {
//     // 데이터베이스 연결 정보 로깅 (비밀번호는 제외)
//     console.log("🔍 Attempting to connect to database with config:", {
//       host: config.db.host,
//       port: config.db.port,
//       database: config.db.database,
//       user: config.db.user,
//       // 비밀번호는 보안상 로그에 남기지 않음
//     });

//     // 연결 시도
//     connection = await pool.getConnection();
//     console.log("✅ Successfully connected to MySQL server");

//     // 데이터베이스 존재 여부 확인
//     const [dbs] = await connection.query("SHOW DATABASES LIKE ?", [config.db.database]);
//     if (dbs.length === 0) {
//       console.error(`❌ Database '${config.db.database}' does not exist`);
//       throw new Error(`Database '${config.db.database}' does not exist`);
//     }
//     console.log(`✅ Database '${config.db.database}' exists`);

//     // 테이블 존재 여부 확인
//     const [tables] = await connection.query("SHOW TABLES");
//     console.log(`📊 Found ${tables.length} tables in the database`);

//     // 데이터베이스 버전 확인
//     const [rows] = await connection.query("SELECT VERSION() as version");
//     const version = rows[0].version;

//     console.log("✅ Database connection successful!", {
//       version,
//       threadId: connection.threadId,
//     });
//   } catch (error) {
//     console.error("❌ Database connection failed!");
//     console.error("Error details:", {
//       code: error.code,
//       errno: error.errno,
//       sqlState: error.sqlState,
//       sqlMessage: error.sqlMessage,
//       message: error.message,
//       stack: error.stack
//     });
    
//     console.error("Connection config:", {
//       host: config.db.host,
//       port: config.db.port,
//       database: config.db.database,
//       // user: config.db.user,
//       // 비밀번호는 보안상 로그에 남기지 않음
//     });

//     // 연결이 성공했지만 쿼리 실행 중 오류가 발생한 경우
//     if (connection && typeof connection.release === 'function') {
//       console.log("Releasing connection...");
//       try {
//         await connection.release();
//       } catch (err) {
//         console.error("Error releasing connection:", err);
//       }
//     }

//     // 프로덕션 환경이 아닌 경우에만 프로세스 종료
//     if (process.env.NODE_ENV !== "production") {
//       process.exit(1);
//     }
//   } finally {
//     if (connection && typeof connection.release === 'function') {
//       try {
//         await connection.release();
//       } catch (err) {
//         console.error("Error releasing connection in finally block:", err);
//       }
//     }
//   }
// };

// 트랜잭션 헬퍼 함수
const withTransaction = async (callback) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error("Transaction failed", { error });
    throw error;
  } finally {
    connection.release();
  }
};

// 쿼리 실행 헬퍼 함수
const query = async (sql, params, connection = null) => {
  const conn = connection || (await pool.getConnection());

  try {
    const [rows] = await conn.query(sql, params);
    return rows;
  } catch (error) {
    logger.error("Query execution failed", {
      error: {
        code: error.code,
        sqlMessage: error.sqlMessage,
        sql: error.sql,
      },
      query: sql,
      params,
    });
    throw error;
  } finally {
    if (!connection) {
      conn.release();
    }
  }
};

// 애플리케이션 시작 시 연결 테스트 실행
// if (process.env.NODE_ENV !== "test") {
//   testConnection().catch(err => {
//     console.error('Failed to test database connection:', err);
//     process.exit(1);
//   });
// }

// Export pool and database functions
export const db = {
  pool,
  getConnection: () => pool.getConnection(),
  query: (sql, params) => pool.query(sql, params),
  execute: (sql, params) => pool.execute(sql, params)
};

// Export the database connection utilities
export { pool, withTransaction, query as dbQuery };

// Export the db object with all database methods
export default {
  pool,
  getConnection: () => pool.getConnection(),
  query: (sql, params) => pool.query(sql, params),
  execute: (sql, params) => pool.execute(sql, params),
  withTransaction
};
