import fs from 'fs';
import path from 'path';
import { redact } from '../../src/utils/logger';
import { isPublicSiteQueueFullText } from '../../src/utils/siteAvailability';

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
  httpResponses?: string[];
  environmentSignals?: string[];
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

function attachmentText(attempt: Attempt, name: string): string | undefined {
  const attachment = attempt.attachments?.find((item) => item.name === name);
  if (!attachment) return undefined;
  if (attachment.body !== undefined) return Buffer.from(attachment.body, 'base64').toString('utf-8');
  if (!attachment.path) return undefined;

  const resultsRoot = path.resolve(process.cwd(), 'test-results');
  const attachmentFullPath = path.resolve(process.cwd(), attachment.path);
  const relativePath = path.relative(resultsRoot, attachmentFullPath);
  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new Error(`${name} attachment path must be inside test-results`);
  }
  if (!fs.existsSync(attachmentFullPath)) return undefined;
  return fs.readFileSync(attachmentFullPath, 'utf-8');
}

function environmentSignals(attempt: Attempt, httpResponses: string[] | undefined): string[] | undefined {
  const signals: string[] = [];
  const errorContext = attachmentText(attempt, 'error-context.md');
  if (errorContext && isPublicSiteQueueFullText(errorContext)) {
    signals.push('PUBLIC_SITE_QUEUE_FULL');
  }
  if (httpResponses?.some((response) => /\bHTTP 403\b.*\bserver=cloudflare\b/i.test(response))) {
    signals.push('PUBLIC_SITE_CLOUDFLARE_403');
  }
  return signals.length > 0 ? signals : undefined;
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
      const httpResponses = attachmentStringArray(failedAttempt ?? {}, 'http-responses.json');

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
        httpResponses,
        environmentSignals: environmentSignals(failedAttempt ?? {}, httpResponses),
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
        (attachment) => attachment.name === `${id.toLowerCase()}-rca-hypothesis.json` && attachment.body,
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
    const status = {
      available: false,
      reason: 'test-results/results.json was not found',
    };
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
