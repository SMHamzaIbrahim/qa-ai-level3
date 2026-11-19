# Skill: Root Cause Analysis (RCA)

## Purpose
To accurately classify test failures and distinguish between product defects, test script issues, and environmental factors.

## Inputs
- Playwright `results.json`, test ID, status, and retry attempts.
- Sanitized stack, trace, screenshot, video, and run/commit metadata when available.
- Explicit controlled-fault ID and recent code changes when supplied by a reviewer.
- When `OPENAI_API_KEY` is configured on a trusted main-branch workflow, a bounded diagnostic payload containing scenario/title/status, sanitized error text, and network failures.

## Outputs
- A structured JSON and Markdown report (`reports/rca/`).
- A sanitized, versioned prompt/output audit (`reports/rca/openai-evidence.json`) when a real provider request runs; skipped and failed calls are labeled.
- Classification (e.g., `PRODUCT_DEFECT`, `TEST_SCRIPT_DEFECT`, `THIRD_PARTY_DEPENDENCY`).
- Confidence score (0.0 to 1.0).
- Recommended action.
- Alternatives, validation step, human-review state, retry count, run URL, and commit SHA.

## Rules & Guardrails
- **Evidence-Based Only:** Never infer a product defect from an assertion mismatch alone. If evidence is missing, classify as `UNKNOWN` or a low-confidence hypothesis.
- **No Silent Fixes:** The AI is not allowed to automatically fix or alter test code based on an RCA. It can only suggest a patch.
- **Sanitization:** Never send HTML, traces, screenshots, videos, passwords, or raw request bodies to the external provider. Redact diagnostic text before transmission.
- **Provider boundary:** Pull requests and non-main refs run model-free. Missing credentials use deterministic classification; provider errors are recorded, produce the deterministic fallback report, and fail the analyzer step.
- **Human review:** All provider-generated classifications remain hypotheses pending human review; confidence is not independently calibrated. Controlled fault-injection reports remain pending until a reviewer records the decision.

## Human Checkpoint
A human reviewer must validate the RCA classification and approve any suggested fixes.