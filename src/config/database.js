import mysql from 'mysql2/promise';
import config from './config.js';
import logger from '../utils/logger.js';

// MySQL 연결 풀 생성
const pool = mysql.createPool({
  ...config.db,
  ...(config.nodeEnv === 'development' && {
    debug: true,
    trace: true,
  }),
});

// 연결 풀 이벤트 리스너
pool.on('acquire', (connection) => {
  logger.debug(`🔌 Connection ${connection.threadId} acquired`);
});

pool.on('release', (connection) => {
  logger.debug(`🔌 Connection ${connection.threadId} released`);
});

pool.on('enqueue', () => {
  logger.debug('🔌 Waiting for available connection slot');
});

// 연결 테스트
const testConnection = async () => {
  let connection;
  try {
    logger.info('🔍 Connecting to database...', {
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
    });

    connection = await pool.getConnection();
    
    // 데이터베이스 버전 확인
    const [rows] = await connection.query('SELECT VERSION() as version');
    const version = rows[0].version;
    
    logger.info('✅ Database connection successful!', { 
      version,
      threadId: connection.threadId 
    });
    
  } catch (error) {
    logger.error('❌ Database connection failed!', {
      error: {
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        message: error.message,
      },
      config: {
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
      },
    });
    
    // 연결이 성공했지만 쿼리 실행 중 오류가 발생한 경우
    if (connection) {
      logger.info('ℹ️ Releasing connection...');
      await connection.release();
    }
    
    // 프로덕션 환경이 아닌 경우에만 프로세스 종료
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

// 트랜잭션 헬퍼 함수
export const withTransaction = async (callback) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('Transaction failed', { error });
    throw error;
  } finally {
    connection.release();
  }
};

// 쿼리 실행 헬퍼 함수
export const query = async (sql, params, connection = null) => {
  const conn = connection || await pool.getConnection();
  
  try {
    const [rows] = await conn.query(sql, params);
    return rows;
  } catch (error) {
    logger.error('Query execution failed', {
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
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

export default pool;
