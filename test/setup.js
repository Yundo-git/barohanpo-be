// Test setup file
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock console methods to keep test output clean
const originalConsole = { ...console };

beforeAll(() => {
  // Mock console methods
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});

afterAll(() => {
  // Restore original console methods
  global.console = originalConsole;
});
