import fs from 'fs';
import path from 'path';
import { redact } from '../../src/utils/logger';

interface Attachment {
  name?: string;
  body?: string;
  contentType?: string;
  path?: string;
}

interface Attempt {
  error?: {
    message?: string;
    stack?: string;
  };
  attachments?: Attachment[];
}

interface PlaywrightTest {
  status?: string;
  results?: Attempt[];
}

interface Spec {
  title?: string;
  tests?: PlaywrightTest[];
}

interface Suite {
  specs?: Spec[];
  suites?: Suite[];
}

interface PlaywrightResults {
  suites?: Suite[];
}

export interface FailureInput {
  scenarioId: string;
  testTitle: string;
  errorMessage: string;
  stackTrace: string;
  status: string;
  retryCount: number;
  tracePath?: string;
  screenshotPath?: string;
  videoPath?: string;
  consoleErrors?: string[];
  networkFailures?: string[];
  faultInjectionId?: string;
  runUrl?: string;
  commitSha?: string;
}

export interface ControlledFault {
  id: string;
  testTitle: string;
  playwrightStatus: string;
  reviewStatus: 'PENDING';
  record: unknown;
  attachments: Array<{ name: string; contentType?: string; path?: string }>;
}

function attachmentPath(attempt: Attempt, name: string): string | undefined {
  return attempt.attachments?.find((attachment) => attachment.name === name)?.path;
}

function attachmentStringArray(attempt: Attempt, name: string): string[] | undefined {
  const body = attempt.attachments?.find((attachment) => attachment.name === name)?.body;
  if (!body) return undefined;
  const value: unknown = JSON.parse(Buffer.from(body, 'base64').toString('utf-8'));
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`Expected ${name} to contain a JSON string array`);
  }
  return value.map(redact);
}

function visitSpecs(results: PlaywrightResults, visit: (spec: Spec) => void): void {
  const traverse = (suites: Suite[] = []): void => {
    for (const suite of suites) {
      for (const spec of suite.specs ?? []) {
        visit(spec);
      }

      traverse(suite.suites);
    }
  };

  traverse(results.suites);
}

export function collectFailures(results: PlaywrightResults): FailureInput[] {
  const failures: FailureInput[] = [];
  visitSpecs(results, (spec) => {
    const title = spec.title ?? 'Untitled test';
    const scenarioId = title.match(/(?:AE|FI)-\d+/)?.[0] ?? 'UNKNOWN';

    for (const test of spec.tests ?? []) {
      if (test.status !== 'unexpected' && test.status !== 'flaky') continue;

      const attempts = test.results ?? [];
      const failedAttempt = attempts.find((attempt) => attempt.error) ?? attempts[attempts.length - 1];
      const error = failedAttempt?.error;

      failures.push({
        scenarioId,
        testTitle: redact(title),
        errorMessage: redact(error?.message ?? 'No error message provided'),
        stackTrace: redact(error?.stack ?? 'No stack trace'),
        status: test.status,
        retryCount: Math.max(0, attempts.length - 1),
        tracePath: attachmentPath(failedAttempt ?? {}, 'trace'),
        screenshotPath: attachmentPath(failedAttempt ?? {}, 'screenshot'),
        videoPath: attachmentPath(failedAttempt ?? {}, 'video'),
        consoleErrors: attachmentStringArray(failedAttempt ?? {}, 'console-errors.json'),
        networkFailures: attachmentStringArray(failedAttempt ?? {}, 'network-failures.json'),
        faultInjectionId: title.match(/FI-\d+/)?.[0],
        runUrl:
          process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
            ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
            : undefined,
        commitSha: process.env.GITHUB_SHA,
      });
    }
  });
  return failures;
}

export function collectControlledFaults(results: PlaywrightResults): ControlledFault[] {
  const controlledFaults: ControlledFault[] = [];
  visitSpecs(results, (spec) => {
    const title = spec.title ?? 'Untitled test';
    const id = title.match(/FI-\d+/)?.[0];
    if (!id) return;

    for (const test of spec.tests ?? []) {
      const attempt = test.results?.[test.results.length - 1];
      const recordAttachment = attempt?.attachments?.find(
        (attachment) =>
          attachment.name === `${id.toLowerCase()}-rca-hypothesis.json` && attachment.body,
      );
      if (!recordAttachment?.body) continue;

      const json = Buffer.from(recordAttachment.body, 'base64').toString('utf-8');
      const attachments = (attempt?.attachments ?? [])
        .filter((attachment): attachment is Attachment & { name: string } => Boolean(attachment.name))
        .map(({ name, contentType, path }) => ({ name, contentType, path }));
      controlledFaults.push({
        id,
        testTitle: redact(title),
        playwrightStatus: test.status ?? 'unknown',
        reviewStatus: 'PENDING',
        record: JSON.parse(json) as unknown,
        attachments,
      });
    }
  });
  return controlledFaults;
}

function main(): void {
  console.log('[RCA Collector] Starting failure collection...');
  const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
  const outputDir = path.join(process.cwd(), 'reports', 'rca');
  const outputPath = path.join(outputDir, 'failures.json');
  const controlledFaultPath = path.join(outputDir, 'fault-injections.json');
  const statusPath = path.join(outputDir, 'collection-status.json');
  fs.mkdirSync(outputDir, { recursive: true });

  if (!fs.existsSync(resultsPath)) {
    const status = { available: false, reason: 'test-results/results.json was not found' };
    fs.writeFileSync(outputPath, JSON.stringify([], null, 2));
    fs.writeFileSync(controlledFaultPath, JSON.stringify([], null, 2));
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    console.warn(`[RCA Collector] ${status.reason}; wrote an explicit unavailable status.`);
    return;
  }

  fs.writeFileSync(statusPath, JSON.stringify({ available: false, reason: 'collection is incomplete' }, null, 2));
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8')) as PlaywrightResults;
  const failures = collectFailures(results);
  const controlledFaults = collectControlledFaults(results);
  fs.writeFileSync(outputPath, JSON.stringify(failures, null, 2));
  fs.writeFileSync(controlledFaultPath, JSON.stringify(controlledFaults, null, 2));
  fs.writeFileSync(statusPath, JSON.stringify({ available: true }, null, 2));
  console.log(
    `[RCA Collector] Found ${failures.length} failures and ${controlledFaults.length} controlled fault records.`,
  );
}

if (require.main === module) {
  main();
}
