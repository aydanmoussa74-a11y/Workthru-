import { runYouTubeDomainTests } from './youtube.test';

async function main() {
  console.log('Running Phase 8 YouTube & Media System Tests...');
  const result = await runYouTubeDomainTests();
  console.log(`Results: ${result.passed} passed, ${result.failed} failed.`);
  if (result.failed > 0) {
    console.error('Errors:', result.errors);
    process.exit(1);
  } else {
    console.log('All Phase 8 YouTube domain and integration tests passed successfully!');
  }
}

main();
