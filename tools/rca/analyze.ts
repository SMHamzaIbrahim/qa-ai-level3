import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import type { FailureInput } from './collect';

export type Classification =
  | 'PRODUCT_DEFECT'
  | 'TEST_SCRIPT_DEFECT'
  | 'LOCATOR_OR_UI_CHANGE'
  | 'TEST_DATA_OR_STATE'
  | 'ENVIRONMENT_OR_NETWORK'
  | 'TIMING_OR_FLAKINESS'
  | 'THIRD_PARTY_DEPENDENCY'
  | 'UNKNOWN';

export const RCARecordSchema = z.object({
  scenario_id: z.string(),
  classification: z.enum([
    'PRODUCT_DEFECT',
    'TEST_SCRIPT_DEFECT',
    'LOCATOR_OR_UI_CHANGE',
    'TEST_DATA_OR_STATE',
    'ENVIRONMENT_OR_NETWORK',
    'TIMING_OR_FLAKINESS',
    'THIRD_PARTY_DEPENDENCY',
    'UNKNOWN',
  ]),
  confidence: z.number().min(0).max(1),
  status: z.enum(['HYPOTHESIS_PENDING_REVIEW', 'AUTO_CLASSIFIED']),
  symptom: z.string(),
  evidence: z.array(
    z.object({
      type: z.string(),
      content: z.string().optional(),
      path: z.string().optional(),
    }),
  ),
  alternatives: z.array(z.string()),
  validation: z.string(),
  recommended_action: z.string(),
  requires_human_approval: z.boolean(),
  retry_count: z.number().int().nonnegative(),
  run_url: z.string().nullable(),
  commit_sha: z.string().nullable(),
});

export type RCARecord = z.infer<typeof RCARecordSchema>;

const CONFIDENCE_THRESHOLD = 0.9;

export function classifyFailure(failure: FailureInput): RCARecord {
  const ansiEscapeSequence = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
  const cleanMessage = failure.errorMessage.replace(ansiEscapeSequence, '');
  const message = cleanMessage.toLowerCase();
  const faultId = failure.faultInjectionId ?? failure.testTitle.match(/FI-\d+/)?.[0];

  let classification: Classification = 'UNKNOWN';
  let confidence = 0.5;
  let validation = 'Review the complete trace and failure context before assigning a cause.';
  let action = 'Collect missing evidence and keep the result unclassified until reviewed.';
  let alternatives = ['Product behavior changed', 'Test data or setup is incorrect', 'Environment issue'];

  if (faultId === 'FI-01') {
    classification = 'TEST_SCRIPT_DEFECT';
    confidence = 0.85;
    validation = 'Compare the injected assertion with the observed value, then rerun the corrected assertion.';
    action = 'Correct only the test expectation or locator supported by the captured evidence.';
  } else if (faultId === 'FI-02') {
    classification = 'ENVIRONMENT_OR_NETWORK';
    confidence = 0.95;
    validation = 'Verify the locally intercepted request-failure event and confirm no product request was sent.';
    action = 'Remove the test-only route interception and rerun the isolated scenario.';
  } else if (
    failure.networkFailures?.some((failureText) => /net::err_|connection (?:refused|reset|failed)/i.test(failureText))
  ) {
    classification = 'ENVIRONMENT_OR_NETWORK';
    confidence = 0.85;
    validation = 'Inspect the failed request and trace to distinguish local network from site availability.';
    action = 'Rerun the isolated test after verifying the network path; do not change product assertions yet.';
    alternatives = ['THIRD_PARTY_DEPENDENCY', 'TEST_SCRIPT_DEFECT'];
  } else if (message.includes('net::err_failed') || message.includes('net::err_connection')) {
    classification = 'ENVIRONMENT_OR_NETWORK';
    confidence = 0.85;
    validation = 'Inspect request-failure details and the trace to distinguish local network from site availability.';
    action = 'Rerun the isolated test after verifying the network path; do not change product assertions yet.';
  } else if (
    message.includes('503') ||
    message.includes('403') ||
    message.includes('queue full') ||
    message.includes('service unavailable')
  ) {
    classification = 'THIRD_PARTY_DEPENDENCY';
    confidence = 0.85;
    validation = 'Confirm the response status and body in the captured network evidence.';
    action = 'Retry later only after confirming the service response; preserve the test and its assertion.';
  } else if (message.includes('timeout') && message.includes('locator')) {
    classification = 'LOCATOR_OR_UI_CHANGE';
    confidence = 0.75;
    validation = 'Inspect the trace DOM and preceding action to distinguish a changed locator from a timing issue.';
    action = 'Propose a locator or synchronization change only after verifying the trace.';
    alternatives = ['TIMING_OR_FLAKINESS', 'TEST_SCRIPT_DEFECT', 'THIRD_PARTY_DEPENDENCY'];
  } else if (message.includes('syntaxerror') || message.includes('is not valid json')) {
    classification = 'ENVIRONMENT_OR_NETWORK';
    confidence = 0.75;
    validation = 'Inspect the sanitized response status and content type before attributing the failure.';
    action = 'Verify the endpoint and service response, then rerun the API check.';
    alternatives = ['THIRD_PARTY_DEPENDENCY', 'TEST_SCRIPT_DEFECT'];
  }

  const evidence: RCARecord['evidence'] = [
    { type: 'stack_trace', content: failure.stackTrace.split('\n').slice(0, 8).join('\n') },
  ];
  if (failure.tracePath) evidence.push({ type: 'trace', path: failure.tracePath });
  if (failure.screenshotPath) evidence.push({ type: 'screenshot', path: failure.screenshotPath });
  if (failure.videoPath) evidence.push({ type: 'video', path: failure.videoPath });
  if (failure.consoleErrors?.length) {
    evidence.push({ type: 'console_errors', content: failure.consoleErrors.join('\n') });
  }
  if (failure.networkFailures?.length) {
    evidence.push({ type: 'network_failures', content: failure.networkFailures.join('\n') });
  }
  if (faultId) evidence.push({ type: 'fault_injection', content: faultId });

  const requiresHumanApproval = confidence < CONFIDENCE_THRESHOLD || Boolean(faultId);
  const status =
    confidence < CONFIDENCE_THRESHOLD || requiresHumanApproval
      ? 'HYPOTHESIS_PENDING_REVIEW'
      : 'AUTO_CLASSIFIED';

  return RCARecordSchema.parse({
    scenario_id: failure.scenarioId,
    classification,
    confidence,
    status,
    symptom: cleanMessage.split('\n')[0],
    evidence,
    alternatives,
    validation,
    recommended_action: action,
    requires_human_approval: requiresHumanApproval,
    retry_count: failure.retryCount,
    run_url: failure.runUrl ?? null,
    commit_sha: failure.commitSha ?? null,
  });
}

function writeUnavailableReport(outputDir: string, reason: string): void {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, 'rca-report.json'),
    JSON.stringify({ status: 'NOT_ANALYZED', reason }, null, 2),
  );
  fs.writeFileSync(
    path.join(outputDir, 'rca-summary.md'),
    `# Root Cause Analysis Report\n\n**Status:** Not analyzed\n\n${reason}\n`,
  );
}

function analyze(): void {
  console.log('[RCA Analyzer] Starting analysis...');
  const outputDir = path.join(process.cwd(), 'reports', 'rca');
  const inputPath = path.join(outputDir, 'failures.json');
  const controlledFaultPath = path.join(outputDir, 'fault-injections.json');
  const statusPath = path.join(outputDir, 'collection-status.json');

  if (!fs.existsSync(inputPath)) {
    const reason = 'No failures.json was found; RCA was not run.';
    console.warn(`[RCA Analyzer] ${reason}`);
    writeUnavailableReport(outputDir, reason);
    return;
  }

  if (fs.existsSync(statusPath)) {
    const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8')) as { available?: boolean; reason?: string };
    if (!status.available) {
      const reason = status.reason ?? 'Test results were unavailable; RCA was not run.';
      writeUnavailableReport(outputDir, reason);
      return;
    }
  }

  const failures = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as FailureInput[];
  const controlledFaults = fs.existsSync(controlledFaultPath)
    ? (JSON.parse(fs.readFileSync(controlledFaultPath, 'utf-8')) as Array<{ record: unknown }>)
    : [];
  const controlledRecords = controlledFaults.map(({ record }) => RCARecordSchema.parse(record));
  const records = [...failures.map(classifyFailure), ...controlledRecords];
  fs.writeFileSync(path.join(outputDir, 'rca-report.json'), JSON.stringify(records, null, 2));

  const markdown = [
    '# Root Cause Analysis Report',
    '',
    `**Failures analyzed:** ${failures.length}`,
    `**Controlled fault exercises:** ${controlledRecords.length} (human review pending)`,
    '',
    ...records.flatMap((record) => [
      `## ${record.scenario_id}`,
      `- **Classification:** \`${record.classification}\` (${Math.round(record.confidence * 100)}% confidence)`,
      `- **Status:** ${record.status}`,
      `- **Symptom:** ${record.symptom}`,
      `- **Retries:** ${record.retry_count}`,
      `- **Validation:** ${record.validation}`,
      `- **Recommended action:** ${record.recommended_action}`,
      `- **Human approval required:** ${record.requires_human_approval ? 'YES' : 'NO'}`,
      `- **Run:** ${record.run_url ?? 'Not available'}`,
      `- **Commit:** ${record.commit_sha ?? 'Not available'}`,
      '',
    ]),
  ].join('\n');

  fs.writeFileSync(path.join(outputDir, 'rca-summary.md'), markdown);
  console.log(`[RCA Analyzer] Analysis complete. Generated JSON and Markdown reports in ${outputDir}`);
}

if (require.main === module) {
  analyze();
}
