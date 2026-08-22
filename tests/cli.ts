import { runAllTests } from './runner';

async function main() {
  console.log('--- STARTING ALL PHASE 0–9 VERIFICATION TESTS ---');
  const result = await runAllTests();
  result.report.forEach((line) => console.log(line));
  if (!result.passed) {
    console.error('Test Suite Failed!');
    process.exit(1);
  }
  console.log('--- ALL PHASE 0–9 TESTS PASSED PERFECTLY ---');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
