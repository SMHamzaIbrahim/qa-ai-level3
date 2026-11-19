# Skill: Root Cause Analysis (RCA)

## Purpose
To accurately classify test failures and distinguish between product defects, test script issues, and environmental factors.

## Inputs
- Playwright `results.json`, test ID, status, and retry attempts.
- Sanitized stack, trace, screenshot, video, and run/commit metadata when available.
- Explicit controlled-fault ID and recent code changes when supplied by a reviewer.

## Outputs
- A structured JSON and Markdown report (`reports/rca/`).
- Classification (e.g., `PRODUCT_DEFECT`, `TEST_SCRIPT_DEFECT`, `THIRD_PARTY_DEPENDENCY`).
- Confidence score (0.0 to 1.0).
- Recommended action.
- Alternatives, validation step, human-review state, retry count, run URL, and commit SHA.

## Rules & Guardrails
- **Evidence-Based Only:** Never infer a product defect from an assertion mismatch alone. If evidence is missing, classify as `UNKNOWN` or a low-confidence hypothesis.
- **No Silent Fixes:** The AI is not allowed to automatically fix or alter test code based on an RCA. It can only suggest a patch.
- **Sanitization:** Never send unredacted HTML, passwords, or personal data to external LLMs.
- **Review threshold:** Confidence below 0.90 requires human approval. Controlled fault-injection reports remain pending until a reviewer records the decision.

## Human Checkpoint
A human reviewer must validate the RCA classification and approve any suggested fixes.