import { runRbacTests } from './rbac.test.js';
import { runAnomalyTests } from './anomalies.test.js';

async function main() {
  console.log('================================================================');
  console.log('  STARTING MPLADS SYSTEM VERIFICATION SUITE');
  console.log('  Features: ML Anomaly, Duplicate Work, Delay & Cost Forecast,');
  console.log('            Persistent Storage, Multi-Authority RBAC Transitions');
  console.log('================================================================');

  const start = Date.now();
  try {
    await runRbacTests();
    await runAnomalyTests();
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log('================================================================');
    console.log(`  ALL TEST SUITES PASSED SUCCESSFULLY IN ${duration}s`);
    console.log('================================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n  TEST SUITE FAILED:', err?.message || err);
    process.exit(1);
  }
}

main();
