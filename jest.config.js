module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  setupFilesAfterEnv: ['./test/setup.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/'
  ],
  testTimeout: 10000, // 10 seconds timeout for tests
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
  testPathIgnorePatterns: ['/node_modules/'],
};
