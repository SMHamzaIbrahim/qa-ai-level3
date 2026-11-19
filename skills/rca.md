# Skill: Root Cause Analysis (RCA)

## Purpose
To accurately classify test failures and distinguish between product defects, test script issues, and environmental factors.

## Inputs
- Playwright `results.json` output.
- Stack traces, trace files, console logs, and network requests.
- Recent code changes (Git diff).

## Outputs
- A structured JSON and Markdown report (`reports/rca/`).
- Classification (e.g., `PRODUCT_DEFECT`, `TEST_SCRIPT_DEFECT`, `THIRD_PARTY_DEPENDENCY`).
- Confidence score (0.0 to 1.0).
- Recommended action.

## Rules & Guardrails
- **Evidence-Based Only:** Never guess. If evidence is missing, classify as `UNKNOWN`.
- **No Silent Fixes:** The AI is not allowed to automatically fix or alter test code based on an RCA. It can only suggest a patch.
- **Sanitization:** Never send unredacted HTML, passwords, or personal data to external LLMs.

## Human Checkpoint
A human reviewer must validate the RCA classification and approve any suggested fixes.