const {
  request,
  TEST_USER,
  cleanupDatabase,
  createTestUser,
  loginTestUser,
  getCookieByName
} = require('../../test-helpers');

describe('Authentication Flow Integration Tests', () => {
  let testUser;
  
  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupDatabase();
    // Create a test user
    testUser = await createTestUser();
  });
  
  afterAll(async () => {
    // Clean up test data after all tests
    await cleanupDatabase();
  });
  
  describe('POST /api/auth/login', () => {
    it('should log in a user with valid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.headers['set-cookie']).toBeDefined();
      
      const refreshTokenCookie = response.headers['set-cookie'].find(cookie => 
        cookie.startsWith('refreshToken=')
      );
      
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('Path=/api/auth/refresh-token');
      expect(refreshTokenCookie).toContain('SameSite=Strict');
    });
    
    it('should return 401 with invalid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message');
    });
  });
  
  describe('GET /api/auth/me', () => {
    let accessToken;
    
    beforeAll(async () => {
      // Log in to get a valid access token
      const loginResult = await loginTestUser();
      accessToken = loginResult.accessToken;
    });
    
    it('should return current user profile with valid token', async () => {
      const response = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', TEST_USER.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });
    
    it('should return 401 without valid token', async () => {
      const response = await request
        .get('/api/auth/me');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });
  
  describe('POST /api/auth/refresh-token', () => {
    let refreshTokenCookie;
    let originalAccessToken;
    
    beforeAll(async () => {
      // Log in to get refresh token
      const loginResult = await loginTestUser();
      originalAccessToken = loginResult.accessToken;
      refreshTokenCookie = getCookieByName(loginResult.cookies, 'refreshToken');
    });
    
    it('should refresh access token with valid refresh token', async () => {
      const response = await request
        .post('/api/auth/refresh-token')
        .set('Cookie', [refreshTokenCookie]);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.accessToken).not.toBe(originalAccessToken);
      expect(response.body.data).toHaveProperty('user');
      
      // Verify new refresh token is set in cookies
      const newRefreshTokenCookie = response.headers['set-cookie'].find(cookie => 
        cookie.startsWith('refreshToken=')
      );
      expect(newRefreshTokenCookie).toBeDefined();
      expect(newRefreshTokenCookie).not.toBe(refreshTokenCookie);
    });
    
    it('should return 401 with invalid refresh token', async () => {
      const response = await request
        .post('/api/auth/refresh-token')
        .set('Cookie', ['refreshToken=invalidtoken']);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });
  
  describe('POST /api/auth/logout', () => {
    let accessToken;
    let refreshTokenCookie;
    
    beforeEach(async () => {
      // Log in before each test to get fresh tokens
      const loginResult = await loginTestUser();
      accessToken = loginResult.accessToken;
      refreshTokenCookie = getCookieByName(loginResult.cookies, 'refreshToken');
    });
    
    it('should log out user and clear refresh token', async () => {
      // First verify we can access protected route
      const meResponse = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(meResponse.status).toBe(200);
      
      // Log out
      const response = await request
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Check if refresh token cookie is cleared
      const clearedCookie = response.headers['set-cookie'].find(cookie => 
        cookie.startsWith('refreshToken=')
      );
      expect(clearedCookie).toContain('Max-Age=0');
      
      // Verify token is invalidated by trying to use it
      const meAfterLogout = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(meAfterLogout.status).toBe(401);
    });
  });
});
