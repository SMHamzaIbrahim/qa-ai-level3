import fs from 'fs';
import path from 'path';

type Classification = 
  | 'PRODUCT_DEFECT'
  | 'TEST_SCRIPT_DEFECT'
  | 'LOCATOR_OR_UI_CHANGE'
  | 'TEST_DATA_OR_STATE'
  | 'ENVIRONMENT_OR_NETWORK'
  | 'TIMING_OR_FLAKINESS'
  | 'THIRD_PARTY_DEPENDENCY'
  | 'UNKNOWN';

interface FailureInput {
  scenarioId: string;
  testTitle: string;
  errorMessage: string;
  stackTrace: string;
  status: string;
  tracePath?: string;
}

interface RCARecord {
  scenario_id: string;
  classification: Classification;
  confidence: number;
  status: 'HYPOTHESIS_PENDING_REVIEW' | 'AUTO_CLASSIFIED';
  symptom: string;
  evidence: any[];
  alternatives: string[];
  validation: string;
  recommended_action: string;
  requires_human_approval: boolean;
}

function classifyFailure(failure: FailureInput): RCARecord {
  let classification: Classification = 'UNKNOWN';
  let confidence = 0.5;
  let validation = 'Manual review required.';
  let action = 'Investigate manually.';
  let alternatives = ['Unverified hypothesis'];

  const msg = failure.errorMessage.toLowerCase();

  // Rule-based classification logic (Model-Free Fallback)
  if (msg.includes('net::err_failed') || msg.includes('net::err_connection')) {
    classification = 'ENVIRONMENT_OR_NETWORK';
    confidence = 0.95;
    validation = 'Check network logs. The browser failed to establish a connection.';
    action = 'Do not blame the product. Check internet connection, VPN, or environment variables.';
    alternatives = ['THIRD_PARTY_DEPENDENCY', 'PRODUCT_DEFECT'];
  }
  else if (msg.includes('503') || msg.includes('403') || msg.includes('queue full') || msg.includes('service unavailable')) {
    classification = 'THIRD_PARTY_DEPENDENCY';
    confidence = 0.95;
    validation = 'Inspect network logs. The target site is rate-limiting or under heavy load.';
    action = 'Wait for the public site to recover. Do not change test code.';
    alternatives = ['ENVIRONMENT_OR_NETWORK', 'PRODUCT_DEFECT'];
  } 
  else if (msg.includes('timeout') && msg.includes('locator')) {
    classification = 'LOCATOR_OR_UI_CHANGE';
    confidence = 0.85;
    validation = 'Open trace viewer. Check if the element exists in the DOM but with a different selector.';
    action = 'Update Page Object locator.';
    alternatives = ['TIMING_OR_FLAKINESS', 'TEST_SCRIPT_DEFECT'];
  }
  else if (msg.includes('expect(received).tobe(expected)')) {
    classification = 'PRODUCT_DEFECT';
    confidence = 0.70;
    validation = 'Verify expected vs received values in the error log. Check if the business logic changed.';
    action = 'Raise a bug ticket if the expected outcome is per requirements.';
    alternatives = ['TEST_DATA_OR_STATE', 'TEST_SCRIPT_DEFECT'];
  }
  else if (msg.includes('syntaxerror') || msg.includes('is not valid json')) {
    classification = 'ENVIRONMENT_OR_NETWORK';
    confidence = 0.90;
    validation = 'Inspect raw API response. Site returned HTML instead of JSON.';
    action = 'Ensure API endpoint is available. Check for WAF/Anti-bot blocking.';
    alternatives = ['THIRD_PARTY_DEPENDENCY'];
  }

  return {
    scenario_id: failure.scenarioId,
    classification,
    confidence,
    status: 'AUTO_CLASSIFIED',
    symptom: failure.errorMessage.split('\n')[0], // Just the first line
    evidence: [
      { type: 'stack_trace', content: failure.stackTrace.split('\n').slice(0, 3).join('\n') },
      { type: 'trace', path: failure.tracePath || 'Not available' }
    ],
    alternatives,
    validation,
    recommended_action: action,
    requires_human_approval: confidence < 0.90
  };
}

function analyze() {
  console.log('[RCA Analyzer] Starting analysis...');
  const inputPath = path.join(process.cwd(), 'reports', 'rca', 'failures.json');
  const outputDir = path.join(process.cwd(), 'reports', 'rca');
  
  if (!fs.existsSync(inputPath)) {
    console.log('[RCA Analyzer] No failures.json found. No RCA needed.');
    process.exit(0);
  }

  const failures: FailureInput[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  if (failures.length === 0) {
    console.log('[RCA Analyzer] No failures to analyze. Generating clean run summary.');
    fs.writeFileSync(path.join(outputDir, 'rca-summary.md'), '# AI Root Cause Analysis Report\n\n✅ All tests passed. No failures to analyze.');
    fs.writeFileSync(path.join(outputDir, 'rca-report.json'), JSON.stringify([], null, 2));
    process.exit(0);
  }

  const records: RCARecord[] = failures.map(classifyFailure);

  // Write JSON Report
  fs.writeFileSync(path.join(outputDir, 'rca-report.json'), JSON.stringify(records, null, 2));

  // Write Markdown Report
  let md = `# AI Root Cause Analysis Report\n\n`;
  md += `**Total Failures:** ${records.length}\n\n`;

  for (const r of records) {
    md += `## Scenario: ${r.scenario_id}\n`;
    md += `- **Classification:** \`${r.classification}\` (Confidence: ${r.confidence * 100}%)\n`;
    md += `- **Symptom:** ${r.symptom}\n`;
    md += `- **Validation Step:** ${r.validation}\n`;
    md += `- **Recommended Action:** ${r.recommended_action}\n`;
    md += `- **Human Approval Required:** ${r.requires_human_approval ? 'YES' : 'NO'}\n\n`;
  }

  fs.writeFileSync(path.join(outputDir, 'rca-summary.md'), md);
  console.log(`[RCA Analyzer] Analysis complete. Generated JSON and Markdown reports in ${outputDir}`);
}

analyze();