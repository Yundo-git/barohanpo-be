const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@1234',
  name: 'Test User',
  phone: '01012345678'
};

/**
 * Cleans up test data from the database
 */
async function cleanupDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Delete test user if exists
    await connection.query('DELETE FROM users WHERE email = ?', [TEST_USER.email]);
    
    // Clear refresh tokens
    await connection.query('TRUNCATE TABLE refresh_tokens');
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Creates a test user and returns the user data
 * @returns {Promise<Object>} Created user data
 */
async function createTestUser() {
  const hashedPassword = await require('bcryptjs').hash(TEST_USER.password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)',
    [TEST_USER.email, hashedPassword, TEST_USER.name, TEST_USER.phone]
  );
  
  return {
    id: result.insertId,
    ...TEST_USER,
    password: hashedPassword
  };
}

/**
 * Logs in a test user and returns the access token and cookies
 * @param {Object} user - User credentials
 * @returns {Promise<{accessToken: string, cookies: string[]}>} Access token and cookies
 */
async function loginTestUser(user = TEST_USER) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: user.password
    });
    
  const cookies = response.headers['set-cookie'] || [];
  const accessToken = response.body.data?.token;
  
  return { accessToken, cookies };
}

/**
 * Extracts a specific cookie by name from the response cookies array
 * @param {string[]} cookies - Array of cookie strings
 * @param {string} name - Cookie name to find
 * @returns {string|undefined} The cookie string or undefined if not found
 */
function getCookieByName(cookies, name) {
  const cookie = cookies.find(cookie => cookie.startsWith(`${name}=`));
  return cookie ? cookie.split(';')[0] : undefined;
}

module.exports = {
  request: require('supertest')(app),
  app,
  TEST_USER,
  cleanupDatabase,
  createTestUser,
  loginTestUser,
  getCookieByName
};
