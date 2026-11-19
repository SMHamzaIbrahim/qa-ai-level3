# Skill: Test Design

## Purpose
To systematically translate requirements into traceable, risk-based test scenarios.

## Inputs
- Requirements from the `docs/requirements.md` or user stories.
- Risk matrix from `docs/strategy.md`.
- Published reference cases (e.g., Automation Exercise TC 1-26).

## Outputs
- A list of test scenarios.
- A traceability matrix mapping scenario ID -> Requirement -> Test Layer (UI/API).
- Edge cases and negative testing suggestions.

## Rules & Guardrails
- **Do not** invent requirements. If an oracle is unknown, output `[MISSING ORACLE]`.
- **Do not** blindly copy reference tests; suggest boundary values and negative cases.
- Every P0 scenario must have a corresponding automated test ID.

## Human Checkpoint
A QA Lead must review and approve the generated test scenarios before automation begins.