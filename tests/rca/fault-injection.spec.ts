import { expect, test } from '@playwright/test';
import { classifyFailure } from '../../tools/rca/analyze';

function currentRunUrl(): string | undefined {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  if (!GITHUB_SERVER_URL || !GITHUB_REPOSITORY || !GITHUB_RUN_ID) return undefined;
  return `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
}

test('FI-01: A deliberately wrong cart expectation is classified as a test defect', async (
  { page },
  testInfo,
) => {
  await page.setContent('<main><h1>Cart total: 4</h1></main>');
  const observedTotal = 4;
  let injectedError = '';

  try {
    expect(observedTotal).toBe(3);
  } catch (error) {
    injectedError = error instanceof Error ? error.message : String(error);
  }

  expect(injectedError).toContain('Expected');
  const record = classifyFailure({
    scenarioId: 'FI-01',
    testTitle: 'FI-01: Wrong expected cart total',
    errorMessage: injectedError,
    stackTrace: 'Controlled assertion mismatch in the isolated FI-01 test.',
    status: 'injected',
    retryCount: 0,
    faultInjectionId: 'FI-01',
    runUrl: currentRunUrl(),
    commitSha: process.env.GITHUB_SHA,
  });

  expect(observedTotal).toBe(4);
  expect(record.classification).toBe('TEST_SCRIPT_DEFECT');
  expect(record.status).toBe('HYPOTHESIS_PENDING_REVIEW');
  expect(record.requires_human_approval).toBe(true);
  await testInfo.attach('fi-01-before-fix.png', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await testInfo.attach('fi-01-rca-hypothesis.json', {
    body: JSON.stringify(record, null, 2),
    contentType: 'application/json',
  });
});

test('FI-02: Locally intercepted navigation failure is classified as environmental', async (
  { page },
  testInfo,
) => {
  const requestFailures: string[] = [];
  page.on('requestfailed', (request) => {
    requestFailures.push(`${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`);
  });
  await page.route('https://automationexercise.com/**', (route) => route.abort('failed'));

  let injectedError = '';
  try {
    await page.goto('https://automationexercise.com/');
  } catch (error) {
    injectedError = error instanceof Error ? error.message : String(error);
  }

  expect(injectedError).toMatch(/ERR_FAILED|net::ERR/i);
  expect(requestFailures.length).toBeGreaterThan(0);
  const record = classifyFailure({
    scenarioId: 'FI-02',
    testTitle: 'FI-02: Local route interception',
    errorMessage: injectedError,
    stackTrace: injectedError,
    status: 'injected',
    retryCount: 0,
    faultInjectionId: 'FI-02',
    runUrl: currentRunUrl(),
    commitSha: process.env.GITHUB_SHA,
  });

  expect(record.classification).toBe('ENVIRONMENT_OR_NETWORK');
  expect(record.status).toBe('HYPOTHESIS_PENDING_REVIEW');
  expect(record.requires_human_approval).toBe(true);
  await testInfo.attach('fi-02-network-failures.txt', {
    body: requestFailures.join('\n'),
    contentType: 'text/plain',
  });
  await testInfo.attach('fi-02-rca-hypothesis.json', {
    body: JSON.stringify(record, null, 2),
    contentType: 'application/json',
  });
});
