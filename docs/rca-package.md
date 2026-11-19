# RCA Evidence Package

This package collects the verified controlled-fault decisions and CI evidence. It does not claim that a product defect or production patch was found.

## Controlled fault-injection outputs

The generated hypotheses remain marked `HYPOTHESIS_PENDING_REVIEW`; the subsequent owner decisions are recorded separately in the [human review record](./rca-human-review.md).

| Fault                                           | Generated classification | Confidence | Generated status | Human decision                    |
| ----------------------------------------------- | ------------------------ | ---------: | ---------------- | --------------------------------- |
| FI-01: isolated wrong cart-total expectation    | `TEST_SCRIPT_DEFECT`     |       0.85 | Pending review   | Approved by the repository owner. |
| FI-02: Playwright-local navigation interception | `ENVIRONMENT_OR_NETWORK` |       0.95 | Pending review   | Approved by the repository owner. |

FI-01's captured page and exact output are available as [fi-01-before-fix.png](./evidence/fi-01-before-fix.png) and [fi-01-rca-hypothesis.json](./evidence/fi-01-rca-hypothesis.json). FI-02's exact result is in [fi-02-rca-hypothesis.json](./evidence/fi-02-rca-hypothesis.json), and its captured request failure is in [fi-02-network-failures.txt](./evidence/fi-02-network-failures.txt). The FI-02 route was aborted locally and did not send a request to the public site. See the [fault-injection tests](../tests/rca/fault-injection.spec.ts) and the [RCA summary](../reports/rca/rca-summary.md).

## GitHub Actions evidence

- [Local full-suite screenshot](./evidence/full-suite-40-passed.png): Playwright report showing 40 passed, 0 failed, and 0 skipped with retries disabled.
- [Run #4](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44579076564) contains **27 tests total: 14 failed and 13 passed**. Its artifact contains 14 collected failures. This is not a 27-failure run.
- [Run #5](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44604227515) completed successfully, but checkout passed only after a retry.
- [Run #6](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44605766505) was triggered by `workflow_dispatch` and completed successfully, but AE-02/AE-04 passed only after retries.

Runs #5 and #6 predate the one-worker configuration and post-artifact flaky-test gate. Their green conclusions therefore do not demonstrate retry-free reliability. Their reports and traces are available from the artifact links on each Actions run page.

## Current limits

- The latest local full suite was 40/40 with retries disabled. The queue-aware skip was not exercised because the target was available; its explicit-message detection is covered by a synthetic-page test. If activated in a future run, the scenario remains a skip, never a pass.
- The available GitHub logs do not show 27 failures. Run #4 is a 27-test run with 14 failures. If a separate 27-failure artifact is intended, add its exact Actions run URL before citing it.
- No PR-triggered Actions run has yet been captured for this evidence package. A manual `workflow_dispatch` run exists (#6).
- No OpenAI provider result or autonomous multi-agent execution is claimed. The model-free decision design is documented in the [AI Decision Matrix](./ai-decision-matrix.md).
