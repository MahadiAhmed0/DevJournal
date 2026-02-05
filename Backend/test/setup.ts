import { execSync } from 'child_process';

/**
 * Global test setup for E2E tests.
 * Runs before all tests to ensure a clean database state.
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Use test database URL if available
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

/**
 * Reset the test database before running tests.
 * This ensures each test run starts with a clean slate.
 */
beforeAll(async () => {
  console.log('🔄 Resetting test database...');

  try {
    // Reset database: drop all tables and re-run migrations
    execSync('npx prisma migrate reset --force --skip-seed', {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
      },
    });

    console.log('✅ Test database reset complete');
  } catch (error) {
    console.error('❌ Failed to reset test database:', error);
    throw error;
  }
});

/**
 * Global timeout for async operations
 */
jest.setTimeout(30000);
