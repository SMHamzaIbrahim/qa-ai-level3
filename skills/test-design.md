# Skill: Test Design

## Purpose
To systematically translate requirements into traceable, risk-based test scenarios.

## Inputs
- Assignment requirements and user stories.
- Risk matrix from `docs/strategy.md` and existing mappings in `docs/traceability.md`.
- Published reference cases (e.g., Automation Exercise TC 1-26).

## Outputs
- Scenarios with ID, priority, feature, steps, test data, expected outcome, layer, source mapping, evidence path, and status.
- A traceability matrix updated in `docs/traceability.md`.
- Edge cases, negative cases, and missing-oracle questions.

## Rules & Guardrails
- **Do not** invent requirements. If an oracle is unknown, output `[MISSING ORACLE]`.
- **Do not** blindly copy reference tests; suggest boundary values and negative cases.
- Every P0 scenario must have a corresponding automated test ID.

## Human Checkpoint
A QA Lead must review and approve the generated test scenarios before automation begins.