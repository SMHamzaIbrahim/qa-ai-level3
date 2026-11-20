import { expect, test } from '@playwright/test';
import { classifyFailure, classifyFailuresWithOpenAI } from '../../tools/rca/analyze';
import { collectControlledFaults, collectFailures } from '../../tools/rca/collect';
import { isPublicSiteQueueFullText, waitForProductGridOrQueueFull } from '../../src/utils/siteAvailability';

test('Assertion mismatch without independent evidence remains unknown', () => {
  const record = classifyFailure({
    scenarioId: 'AE-05',
    testTitle: 'AE-05 API response assertion',
    errorMessage: '\u001b[31mexpect(received).toBe(expected)\u001b[39m',
    stackTrace: 'Assertion failed',
    status: 'unexpected',
    retryCount: 1,
  });

  expect(record.classification).toBe('UNKNOWN');
  expect(record.status).toBe('HYPOTHESIS_PENDING_REVIEW');
  expect(record.requires_human_approval).toBe(true);
  expect(record.retry_count).toBe(1);
});

test('Unverified locator timeout is a low-confidence hypothesis', () => {
  const record = classifyFailure({
    scenarioId: 'AE-18',
    testTitle: 'AE-18 Product review',
    errorMessage: 'TimeoutError: locator.waitFor: Timeout 15000ms exceeded.',
    stackTrace: 'Locator wait failed',
    status: 'unexpected',
    retryCount: 0,
  });

  expect(record.classification).toBe('LOCATOR_OR_UI_CHANGE');
  expect(record.confidence).toBeLessThan(0.9);
  expect(record.requires_human_approval).toBe(true);
});

test('HTTP 403 non-JSON response remains a third-party hypothesis pending review', () => {
  const record = classifyFailure({
    scenarioId: 'AE-05',
    testTitle: 'AE-05 API login',
    errorMessage: 'Error: API returned non-JSON content (HTTP 403): Unexpected end of JSON input',
    stackTrace: 'API response parsing failed',
    status: 'unexpected',
    retryCount: 0,
  });

  expect(record.classification).toBe('THIRD_PARTY_DEPENDENCY');
  expect(record.confidence).toBe(0.85);
  expect(record.status).toBe('HYPOTHESIS_PENDING_REVIEW');
  expect(record.requires_human_approval).toBe(true);
});

test('A captured public queue-full page is classified as a third-party dependency', () => {
  expect(isPublicSiteQueueFullText('This website is under heavy load (queue full).')).toBe(true);
  expect(isPublicSiteQueueFullText('The product grid did not load.')).toBe(false);

  const record = classifyFailure({
    scenarioId: 'AE-12',
    testTitle: 'AE-12 cart quantity',
    errorMessage: 'TimeoutError: locator.waitFor timed out.',
    stackTrace: 'Locator wait failed',
    status: 'unexpected',
    retryCount: 0,
    environmentSignals: ['PUBLIC_SITE_QUEUE_FULL'],
  });

  expect(record.classification).toBe('THIRD_PARTY_DEPENDENCY');
  expect(record.status).toBe('AUTO_CLASSIFIED');
  expect(record.requires_human_approval).toBe(false);
  expect(record.evidence).toContainEqual({
    type: 'environment_signals',
    content: 'PUBLIC_SITE_QUEUE_FULL',
  });
});

test('Product readiness distinguishes the public queue page from a loaded grid', async ({ page }) => {
  await page.setContent('<main>This website is under heavy load (queue full).</main>');
  expect(await waitForProductGridOrQueueFull(page)).toBe(true);

  await page.setContent('<main><div class="features_items"><article>Loaded products</article></div></main>');
  expect(await waitForProductGridOrQueueFull(page)).toBe(false);
});

test('Failure collection preserves retry and trace evidence while redacting emails', () => {
  const failures = collectFailures({
    suites: [
      {
        specs: [
          {
            title: 'AE-05: login validation',
            tests: [
              {
                status: 'flaky',
                results: [
                  {
                    error: {
                      message: 'Failure for qa.user@example.test',
                      stack: 'Expected failure',
                    },
                    attachments: [
                      { name: 'trace', path: 'test-results/trace.zip' },
                      {
                        name: 'network-failures.json',
                        body: Buffer.from(JSON.stringify(['GET https://example.test/api: net::ERR_FAILED'])).toString(
                          'base64',
                        ),
                      },
                      {
                        name: 'error-context.md',
                        body: Buffer.from('This website is under heavy load (queue full).').toString('base64'),
                      },
                    ],
                  },
                  {},
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  expect(failures).toHaveLength(1);
  expect(failures[0].scenarioId).toBe('AE-05');
  expect(failures[0].retryCount).toBe(1);
  expect(failures[0].tracePath).toBe('test-results/trace.zip');
  expect(failures[0].networkFailures).toEqual(['GET https://example.test/api: net::ERR_FAILED']);
  expect(failures[0].environmentSignals).toEqual(['PUBLIC_SITE_QUEUE_FULL']);
  expect(failures[0].errorMessage).not.toContain('qa.user@example.test');
});

test('Failure collection rejects error-context attachments outside test-results', () => {
  expect(() =>
    collectFailures({
      suites: [
        {
          specs: [
            {
              title: 'AE-12: cart quantity',
              tests: [
                {
                  status: 'unexpected',
                  results: [
                    {
                      error: { message: 'Locator timed out' },
                      attachments: [{ name: 'error-context.md', path: 'package.json' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  ).toThrow('error-context.md attachment path must be inside test-results');
});

test('Controlled fault report attachments are retained for the RCA artifact', () => {
  const record = classifyFailure({
    scenarioId: 'FI-01',
    testTitle: 'FI-01: Wrong expected value',
    errorMessage: 'Expected 3; received 4',
    stackTrace: 'Controlled assertion',
    status: 'injected',
    retryCount: 0,
    faultInjectionId: 'FI-01',
  });
  const faultRecords = collectControlledFaults({
    suites: [
      {
        specs: [
          {
            title: 'FI-01: Wrong expected value',
            tests: [
              {
                status: 'expected',
                results: [
                  {
                    attachments: [
                      {
                        name: 'fi-01-rca-hypothesis.json',
                        contentType: 'application/json',
                        body: Buffer.from(JSON.stringify(record)).toString('base64'),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  expect(faultRecords).toHaveLength(1);
  expect(faultRecords[0].id).toBe('FI-01');
  expect(faultRecords[0].reviewStatus).toBe('PENDING');
  expect(faultRecords[0].attachments[0].name).toBe('fi-01-rca-hypothesis.json');
});

test('OpenAI RCA sends sanitized evidence and keeps its classification pending review', async () => {
  let requestBody = '';
  const fetchMock: typeof fetch = async (_input, init) => {
    requestBody = String(init?.body);
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                results: [
                  {
                    index: 0,
                    classification: 'PRODUCT_DEFECT',
                    confidence: 0.97,
                    symptom: 'Service returned 503',
                    alternatives: ['ENVIRONMENT_OR_NETWORK'],
                    validation: 'Confirm the response status in the recorded network evidence.',
                    recommended_action: 'Retain the assertion and rerun after the service recovers.',
                  },
                ],
              }),
            },
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };

  const result = await classifyFailuresWithOpenAI(
    [
      {
        scenarioId: 'AE-23',
        testTitle: 'AE-23 product request',
        errorMessage: '503 for qa.user@example.test?token=sample-secret api_key=sk-123456789012345678901234567890',
        stackTrace: 'Failure in product request',
        status: 'unexpected',
        retryCount: 0,
        networkFailures: ['GET https://example.test/api?token=sample-secret: 503'],
        environmentSignals: ['PUBLIC_SITE_QUEUE_FULL'],
      },
    ],
    { apiKey: 'test-key', fetch: fetchMock },
  );

  expect(requestBody).not.toContain('qa.user@example.test');
  expect(requestBody).not.toContain('sample-secret');
  expect(requestBody).not.toContain('sk-123456789012345678901234567890');
  expect(result.records).toHaveLength(1);
  expect(result.records[0].classification).toBe('THIRD_PARTY_DEPENDENCY');
  expect(result.records[0].confidence).toBe(0.95);
  expect(result.records[0].status).toBe('HYPOTHESIS_PENDING_REVIEW');
  expect(result.records[0].requires_human_approval).toBe(true);
  expect(result.audit.status).toBe('COMPLETED');
  if (result.audit.status !== 'COMPLETED') {
    throw new Error('Expected a completed provider audit');
  }
  expect(result.audit.prompt_version).toBe('qa-rca-v2');
  expect(requestBody).toContain('PUBLIC_SITE_QUEUE_FULL');
  expect(JSON.stringify(result.audit)).not.toContain('qa.user@example.test');
  expect(JSON.stringify(result.audit)).not.toContain('sample-secret');
  expect(result.audit.response.results[0].classification).toBe('PRODUCT_DEFECT');
});

test('OpenAI RCA marks empty input as not run without contacting the provider', async () => {
  let called = false;
  const fetchMock: typeof fetch = async () => {
    called = true;
    throw new Error('Provider must not be called for empty input');
  };
  const result = await classifyFailuresWithOpenAI([], {
    apiKey: 'test-key',
    fetch: fetchMock,
  });

  expect(called).toBe(false);
  expect(result.records).toEqual([]);
  expect(result.audit.status).toBe('NOT_RUN');
  if (result.audit.status === 'NOT_RUN') {
    expect(result.audit.reason).toBe('No failures were provided.');
  }
});

test('OpenAI RCA reports provider errors rather than silently accepting them', async () => {
  const fetchMock: typeof fetch = async () => new Response('Unauthorized', { status: 401 });

  await expect(
    classifyFailuresWithOpenAI(
      [
        {
          scenarioId: 'AE-23',
          testTitle: 'AE-23 product request',
          errorMessage: 'Service unavailable',
          stackTrace: 'Failure in product request',
          status: 'unexpected',
          retryCount: 0,
        },
      ],
      { apiKey: 'test-key', fetch: fetchMock },
    ),
  ).rejects.toThrow('HTTP 401');
});
