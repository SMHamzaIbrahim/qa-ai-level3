import fs from 'fs';
import path from 'path';
import { classifyFailuresWithOpenAI } from './analyze';
import type { FailureInput } from './collect';

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is required for the provider smoke test');

  const failure: FailureInput = {
    scenarioId: 'SYNTHETIC-RCA-SMOKE',
    testTitle: 'Synthetic OpenAI provider connectivity check',
    errorMessage: 'Synthetic health check returned HTTP 503; no application was contacted.',
    stackTrace: 'Synthetic provider smoke input only.',
    status: 'synthetic',
    retryCount: 0,
    networkFailures: ['GET https://example.invalid/health: synthetic HTTP 503'],
  };
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const result = await classifyFailuresWithOpenAI([failure], { apiKey, model });
  const outputDir = path.join(process.cwd(), 'reports', 'rca');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, 'openai-smoke-evidence.json'),
    JSON.stringify(
      {
        kind: 'SYNTHETIC_PROVIDER_SMOKE',
        warning: 'This synthetic connectivity check is not a real application failure or a prompt-correction example.',
        audit: result.audit,
        record: result.records[0],
      },
      null,
      2,
    ),
  );
  console.log(`[OpenAI smoke] Provider response recorded for model ${model}. Human review is still required.`);
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    const reason = error instanceof Error ? error.message : 'Unknown provider smoke error';
    console.error(`[OpenAI smoke] Failed: ${reason}`);
    process.exitCode = 1;
  });
}
