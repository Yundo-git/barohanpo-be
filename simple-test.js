import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('Testing database connection with the following settings:');
console.log(`- Host: ${process.env.DB_HOST}`);
console.log(`- Port: ${process.env.DB_PORT || 3306}`);
console.log(`- User: ${process.env.DB_USER}`);
console.log(`- Database: ${process.env.DB_DATABASE}`);

const connectionConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
};

async function testConnection() {
  let connection;
  try {
    console.log('\nCreating connection pool...');
    const pool = mysql.createPool(connectionConfig);
    
    console.log('Getting connection from pool...');
    connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL server');
    
    console.log('\nTesting simple query...');
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('✅ Test query result:', rows[0].result);
    
  } catch (error) {
    console.error('\n❌ Error:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔍 Connection was refused. Check if:');
      console.error('1. MySQL server is running');
      console.error('2. The host and port are correct');
      console.error('3. The user has permission to connect');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔍 Access denied. Check if:');
      console.error('1. The username is correct');
      console.error('2. The password is correct');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n🔍 Database does not exist or access denied');
    }
    
  } finally {
    if (connection) {
      await connection.release();
      console.log('\n✅ Connection released');
    }
    process.exit();
  }
}

testConnection();
