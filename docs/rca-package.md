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
- [Manual run #8](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44634882140) recorded two flaky tests: AE-08 checked its results heading before it appeared, and checkout filled the card form before it rendered. Both paths now wait for the required UI state.
- [PR run #9](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44636367563) and [manual run #11](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44638385240) passed 40/40 after those state waits.
- [Manual run #10](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44636494518) ran concurrently with two other branch workflows and recorded 27 failed / 13 passed. Its failure artifact is retained; the concurrent runs make this result unsuitable as clean evidence, but concurrency is not asserted as the proven root cause. The later isolated manual run #11 passed 40/40.
- [PR run #12](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44639128921) recorded one flaky AE-04 setup: the `Account Created!` confirmation timed out at the fixture's 15-second default, then succeeded on retry. The fixture now allows up to 30 seconds for that visible confirmation.
- [PR runs #13](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44640417161), [#15](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44641389356), and [#17](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44647344720), [manual run #14](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44640839153), [scheduled run #18](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44647813438), and post-merge [main runs #16](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44645962220) and [#19](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44648398485) passed 40/40 with no flaky tests; each uploaded report artifacts. PR #1 and PR #2 have been merged.
- [PR run #20](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44649122451) failed its strict gate: 13 passed and 27 failed. Ten failures explicitly reported HTTP 403 with non-JSON responses; the other 17 were UI timeouts. The generated deterministic RCA labeled 20 as `THIRD_PARTY_DEPENDENCY` and 7 as `LOCATOR_OR_UI_CHANGE`, all pending review. The repository owner approved only the 10 explicit 403 response cases as third-party response failures; the 17 timeouts remain pending. See the [human review record](./rca-human-review.md).
- The subsequent post-merge [main run #21](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44651006158) passed 40/40. This demonstrates a successful later run, not the cause of run #20's timeouts or the reason for the earlier 403 responses.

Runs #5 and #6 predate the one-worker configuration and post-artifact flaky-test gate. Their green conclusions therefore do not demonstrate retry-free reliability. Their reports and traces are available from the artifact links on each Actions run page.

## FI-01 test-oracle patch validation

This is a local, isolated test-only correction, not a product-code fix. At commit `2566a40e61dfd3ea4dbf2074d39118b5a6fb0bb9`, the targeted test failed with `Expected: 3; Received: 4`, and the captured RCA hypothesis classified the incorrect test expectation as `TEST_SCRIPT_DEFECT`. At commit `3bfffa506fb2593601247676b75af9a0d6e07ce1`, the expected value was corrected and the same targeted test passed with retries disabled.

- Before: [run output](./evidence/fi-01-patch-before-run.txt), [failure screenshot](./evidence/fi-01-patch-before.png), and [RCA hypothesis](./evidence/fi-01-patch-before-hypothesis.json).
- After: [run output](./evidence/fi-01-patch-after-run.txt) and [passing-test screenshot](./evidence/fi-01-patch-after.png).
- This demonstrates a reproducible before/after test-oracle repair. Repository-owner review of the patch is still pending; it does not count as a human-approved product fix or change the provisional rubric score.

## Current limits

- The latest local full suite was 40/40 with retries disabled. The queue-aware skip was not exercised because the target was available; its explicit-message detection is covered by a synthetic-page test. If activated in a future run, the scenario remains a skip, never a pass.
- Run #4 is a 27-test run with 14 failures and 13 passes; it is distinct from manual run #10, which had 27 failed tests and 13 passes.
- PR run #20's 10 explicit HTTP 403 response failures were reviewed as third-party response failures. Its 17 UI timeouts remain unclassified; do not infer their cause from the later green run #21.
- PR run #17, manual run #14, scheduled run #18, and post-merge main runs #19 and #21 are clean CI evidence; PR #1, PR #2, and PR #3 are merged.
- The FI-01 test-oracle correction above is validated by local before/after runs, but still awaits repository-owner review.
- No OpenAI provider result or autonomous multi-agent execution is claimed. The model-free decision design is documented in the [AI Decision Matrix](./ai-decision-matrix.md).
