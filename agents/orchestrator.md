# AI Agent Orchestrator

## Overview
This document defines the responsibilities, boundaries, and handoffs for the AI agents operating in this QA pipeline.

## Agent 1: Test Design Agent
- **Trigger:** New requirements or feature change.
- **Tools Allowed:** `skills/test-design.md`, requirements documents.
- **Action:** Proposes test scenarios and updates traceability matrix.
- **Handoff:** Passes approved scenarios to the Automation Agent.

## Agent 2: Automation Authoring Agent
- **Trigger:** Approved test scenarios.
- **Tools Allowed:** `skills/playwright.md`, VS Code file system.
- **Action:** Writes Playwright TypeScript code, Page Objects, and fixtures.
- **Handoff:** Submits a Pull Request for human review and CI execution.

## Agent 3: Execution Orchestrator
- **Trigger:** Pull Request or Scheduled Cron (05:00 PKT).
- **Tools Allowed:** GitHub Actions, Playwright CLI.
- **Action:** Runs tests, captures artifacts (traces, videos), and saves `results.json`.
- **Handoff:** Sends results to the RCA Agent.

## Agent 4: RCA Agent
- **Trigger:** Failed test execution.
- **Tools Allowed:** `skills/rca.md`, `tools/rca/collect.ts`, `tools/rca/analyze.ts`, LLM API (optional).
- **Action:** Correlates errors, stack traces, and network logs. Classifies the failure.
- **Handoff:** Generates `rca-summary.md` and `rca-report.json`.

## Agent 5: Repair Proposal Agent
- **Trigger:** RCA classifies failure as `TEST_SCRIPT_DEFECT` or `LOCATOR_OR_UI_CHANGE`.
- **Tools Allowed:** `skills/playwright.md`, `skills/review.md`.
- **Action:** Proposes a minimal patch in a separate branch.
- **Guardrail:** Cannot merge to `main`. Requires human approval.

## Agent 6: Quality Reporting Agent
- **Trigger:** End of a CI run.
- **Tools Allowed:** `results.json`, `rca-report.json`.
- **Action:** Generates a high-level summary of pass rates, flaky tests, and AI confidence levels.
- **Handoff:** Publishes the report for the QA Lead to make a Go/No-Go decision.

## Stop Conditions
All agents must halt and request human intervention if:
- An API rate limit is hit repeatedly.
- A prompt injection attempt is detected in the site's DOM.
- The AI is unable to classify a failure with > 60% confidence.
- Test data cleanup fails.