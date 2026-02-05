import { execSync } from 'child_process';

/**
 * Global test setup for E2E tests.
 * Configures environment and optionally resets database.
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Use test database URL if available
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

if (process.env.DIRECT_URL_TEST) {
  process.env.DIRECT_URL = process.env.DIRECT_URL_TEST;
}

/**
 * Global timeout for async operations
 */
jest.setTimeout(30000);

/**
 * Reset database before running tests (only if RESET_TEST_DB is set)
 * In CI, you may want to always reset. Locally, you may skip for speed.
 */
if (process.env.RESET_TEST_DB === 'true') {
  beforeAll(async () => {
    console.log('🔄 Resetting test database...');

    try {
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
}
