import { expect, test } from '@playwright/test';
import { classifyFailure } from '../../tools/rca/analyze';
import { collectControlledFaults, collectFailures } from '../../tools/rca/collect';

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
  expect(failures[0].errorMessage).not.toContain('qa.user@example.test');
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
