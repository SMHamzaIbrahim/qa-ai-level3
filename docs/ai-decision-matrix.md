# AI Decision Matrix

## Operating mode and scope

The assessment evidence in this repository uses the **model-free deterministic RCA path**. The design is agentic in its decomposition of work, tools, evidence handoffs, and human approval gates; it is not an autonomous multi-LLM runtime. No role may edit, merge, or deploy code without human approval.

The implemented workflow is: GitHub Actions triggers Playwright; the collector turns failed attempts into bounded evidence records; the deterministic analyst classifies supported cases; the quality gate evaluates the run after artifacts are uploaded; and a human decides whether a patch or rerun is appropriate. Provider-backed classification remains optional and is not required for this model-free path.

## Deterministic RCA decisions

| Evidence / condition                            | Deterministic outcome    | Confidence | Review / next action                                                      |
| ----------------------------------------------- | ------------------------ | ---------: | ------------------------------------------------------------------------- |
| FI-01 controlled wrong expectation              | `TEST_SCRIPT_DEFECT`     |       0.85 | Human review required; verify the observed value and corrected assertion. |
| FI-02 locally intercepted navigation            | `ENVIRONMENT_OR_NETWORK` |       0.95 | Human review required because controlled faults always require approval.  |
| Captured public-site queue-full message         | `THIRD_PARTY_DEPENDENCY` |       0.95 | Record the signal, preserve assertions, and rerun after recovery.         |
| Connection failure in network evidence          | `ENVIRONMENT_OR_NETWORK` |       0.85 | Human review required; inspect trace and request evidence.                |
| HTTP 403/503 or service-unavailable error       | `THIRD_PARTY_DEPENDENCY` |       0.85 | Human review required; confirm response status/body.                      |
| Locator timeout                                 | `LOCATOR_OR_UI_CHANGE`   |       0.75 | Human review required; inspect trace before changing a locator.           |
| Invalid JSON / syntax error                     | `ENVIRONMENT_OR_NETWORK` |       0.75 | Human review required; inspect response status and content type.          |
| Assertion mismatch with no independent evidence | `UNKNOWN`                |       0.50 | Do not infer a product defect; gather evidence and request review.        |

Confidence below 0.90 remains pending human review. Controlled fault IDs also require review regardless of confidence. The explicit queue-full rule is a narrow exception: it auto-classifies only the confirmed availability signal, never changes an assertion, and does not make the skipped test a pass.

## Role and authority matrix

| Role                 | Inputs and tools                                     | Output / handoff                                                   | Authority and implementation status                                                 |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Test Design          | Assignment requirements, risk strategy, traceability | Approved scenarios and expected outcomes                           | Human-supervised design activity; no test oracle is invented by the runner.         |
| Test Execution       | GitHub triggers, Playwright, page objects, fixtures  | Test results, traces, screenshots, videos                          | Implemented; executes tests but does not change tests or product code.              |
| Evidence Collection  | Playwright JSON results and attachments              | Sanitized failure bundle with retry/run/commit metadata            | Implemented; extracts only bounded evidence and explicit known environment signals. |
| RCA Decision         | Failure bundle and deterministic rules               | Typed classification, confidence, alternatives, validation, action | Implemented as deterministic fallback; makes no code changes.                       |
| Quality Gate         | Test outcome and collected retry status              | Workflow pass/fail after artifact upload                           | Implemented in workflow; a failed or retry-flaky test fails the gate.               |
| Remediation Proposal | Reviewed RCA and relevant code                       | Minimal proposed test or product patch                             | Design contract only; a human must implement/review through a separate PR.          |
| Human Approver       | RCA report, evidence, proposed patch, CI results     | Approve, reject, or request more evidence                          | Required for controlled faults and any code change; no automated merge/deploy.      |

## Queue-full handling

Catalog-dependent tests wait for either the product grid or the explicit public queue-full message. If the queue message is visible, the test attaches a screenshot and is reported as **skipped** with the reason. It is not counted as passed. Other locator, assertion, network, or setup failures continue to fail normally. The queue marker and deterministic RCA signal are shared evidence, not a blanket exception for arbitrary timeouts.

## Evidence and limits

- The orchestration, collection, deterministic decision, quality gate, and human-review boundaries are implemented.
- The remediation proposal role is documented, not an autonomous repair agent.
- Provider-backed output is not claimed in model-free runs.
- Skipped tests, retries, and failures remain separately visible in Playwright and CI artifacts.
- See [architecture](./architecture.md), [orchestrator roles](../agents/orchestrator.md), [RCA guidance](../skills/rca.md), and the [quality scorecard](./quality-scorecard.md).
