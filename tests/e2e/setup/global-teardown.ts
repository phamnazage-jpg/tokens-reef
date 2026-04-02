import { FullConfig } from '@playwright/test';

/**
 * Global Teardown
 * 
 * This runs once after all tests.
 * Use it to:
 * - Cleanup test data
 * - Generate reports
 */

async function globalTeardown(config: FullConfig) {
  console.log('🔧 Running global teardown...');
  console.log('✅ Global teardown complete');
}

export default globalTeardown;
