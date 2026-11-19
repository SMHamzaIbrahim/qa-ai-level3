import fs from 'fs';
import path from 'path';

interface RCAEvidence {
  scenarioId: string;
  testTitle: string;
  errorMessage: string;
  stackTrace: string;
  status: string;
  tracePath?: string;
}

async function collectFailures() {
  console.log('[RCA Collector] Starting failure collection...');
  const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
  const outputDir = path.join(process.cwd(), 'reports', 'rca');
  const outputPath = path.join(outputDir, 'failures.json');

  if (!fs.existsSync(resultsPath)) {
    console.warn('[RCA Collector] No results.json found. Tests may not have run yet.');
    process.exit(0);
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const rawData = fs.readFileSync(resultsPath, 'utf-8');
  const json = JSON.parse(rawData);
  const failures: RCAEvidence[] = [];

  // Traverse the Playwright JSON structure
  const traverseSuites = (suites: any[]) => {
    for (const suite of suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          for (const test of spec.tests) {
            if (test.status === 'unexpected' || test.status === 'flaky') {
              // Extract scenario ID from title (e.g., "AE-01: Account registration")
              const title = spec.title;
              const scenarioIdMatch = title.match(/AE-\d+/);
                            const scenarioId = scenarioIdMatch ? scenarioIdMatch[0] : (title.includes('FI-02') ? 'FI-02' : 'UNKNOWN');

              const error = test.results[0]?.error;
              const traceAttachment = test.results[0]?.attachments?.find((a: any) => a.name === 'trace');

              failures.push({
                scenarioId,
                testTitle: title,
                errorMessage: error?.message || 'No error message provided',
                stackTrace: error?.stack || 'No stack trace',
                status: test.status,
                tracePath: traceAttachment ? traceAttachment.path : undefined,
              });
            }
          }
        }
      }
      if (suite.suites) {
        traverseSuites(suite.suites);
      }
    }
  };

  if (json.suites) {
    traverseSuites(json.suites);
  }

  fs.writeFileSync(outputPath, JSON.stringify(failures, null, 2));
  console.log(`[RCA Collector] Found ${failures.length} failures. Saved to ${outputPath}`);
}

collectFailures().catch((e) => {
  console.error('[RCA Collector] Fatal error:', e);
  process.exit(1);
});