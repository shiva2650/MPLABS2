/**
 * MASTER TEST RUNNER
 * Runs RBAC Enforcement Tests and AI Anomalies & Integrity Verification Tests
 */

import { runRbacTests } from './rbac.test.js';
import { runAnomalyTests } from './anomalies.test.js';
import { runResilienceAndNotificationTests } from './resilience_and_notifications.test.js';

async function main() {
  console.log('================================================================');
  console.log('  STARTING COMPREHENSIVE MPLADS SECURITY & LOGIC VERIFICATION');
  console.log('================================================================');

  const startTime = Date.now();

  try {
    await runRbacTests();
    await runAnomalyTests();
    await runResilienceAndNotificationTests();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('================================================================');
    console.log(`✓ ALL TEST SUITES PASSED SUCCESSFULLY IN ${duration}s`);
    console.log('================================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  }
}

main();
