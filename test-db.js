import { db } from './src/config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

async function testConnection() {
  console.log('Starting database connection test...');
  console.log('Environment variables:');
  console.log(`- DB_HOST: ${process.env.DB_HOST ? '***' : 'NOT SET'}`);
  console.log(`- DB_PORT: ${process.env.DB_PORT || '3306'}`);
  console.log(`- DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
  console.log(`- DB_DATABASE: ${process.env.DB_DATABASE || 'NOT SET'}`);
  
  let connection;
  try {
    console.log('\nAttempting to get database connection...');
    connection = await db.getConnection();
    console.log('✅ Successfully connected to MySQL server');
    
    console.log('\nTesting simple query...');
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('✅ Test query result:', rows[0].result);
    
    console.log('\nChecking if database exists...');
    const [dbs] = await connection.query('SHOW DATABASES LIKE ?', [process.env.DB_DATABASE]);
    if (dbs.length === 0) {
      console.error(`❌ Database '${process.env.DB_DATABASE}' does not exist`);
    } else {
      console.log(`✅ Database '${process.env.DB_DATABASE}' exists`);
      
      // Test if we can access the database
      try {
        console.log('\nTesting database access...');
        await connection.query(`USE ${process.env.DB_DATABASE}`);
        console.log('✅ Successfully accessed database');
        
        // Test a table query
        try {
          console.log('\nTesting table query...');
          const [tables] = await connection.query('SHOW TABLES');
          console.log(`✅ Found ${tables.length} tables in database`);
          if (tables.length > 0) {
            console.log('First table:', tables[0]);
          }
        } catch (tableError) {
          console.error('❌ Error querying tables:', tableError);
        }
      } catch (dbError) {
        console.error('❌ Error accessing database:', dbError);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error connecting to the database:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔍 Connection was refused. Check if:');
      console.error('1. MySQL server is running');
      console.error('2. The host and port are correct');
      console.error('3. The user has permission to connect');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔍 Access denied. Check if:');
      console.error('1. The username is correct');
      console.error('2. The password is correct');
      console.error('3. The user has permission to access the database');
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
