# QA Quality Scorecard

## Current remediation status

| Metric | Result | Evidence / qualification |
|---|---:|---|
| UI scenario IDs | 20 implemented across 18 UI tests; 18/18 passed | See [traceability matrix](./traceability.md) for scenario-level results. |
| Integration scenarios | 1/1 pass | AE-24 compares the first visible product with the typed API result. |
| API tests | 8/8 pass | Includes account CRUD, invalid input, product search, and unsupported methods. |
| TypeScript type check | Pass | `npm run typecheck` passed after the scenario fixes. |
| ESLint | Pass | `npm run lint` passed after the scenario fixes. |
| Local RCA / fault-injection checks | 6/6 pass | Local-only checks including FI-01 and route-intercepted FI-02; this is not a human-reviewed RCA accuracy score. |
| Price parser unit check | 1/1 pass | Covers `Rs. 500`, grouped amounts, and decimal prices. |
| Latest local full-suite pass rate | 34/34 (100%) | One worker, retries disabled. |
| Latest recorded remote test pass rate | 13/27 (48.1%) | Pre-remediation baseline: [GitHub Actions run 44579076564](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44579076564). |
| Post-remediation remote run | Pending | The local run does not replace GitHub Actions evidence. |
| Human-reviewed FI results | Pending | Reviewer rebuttal, approval, and final validated patch evidence must be recorded. |
| PR/scheduled CI evidence | Partial | Workflow has PR/manual/schedule triggers; a manual run exists, but no PR or scheduled run was observed in the available run history. |
| RCA classification accuracy | Not measured | No independent human adjudication has been recorded. |

## Known limitations and next evidence

- RCA uses deterministic, model-free rules. No external model or autonomous agent runtime is configured.
- The assignment requires at least five real prompt/output correction examples. Two examples are currently recorded in [AI evidence](./ai-evidence.md); three more must be captured from actual reviewed interactions.
- The previous full run exposed four UI failures. The latest full run passed after fixing registration completion, currency parsing, checkout selectors/address comparison, and invoice assertions.
- The RCA summary reports zero test failures; both controlled fault exercises remain pending human review.
- Do not claim Level-3 readiness until the mandatory gates, controlled demonstrations, and human review evidence are complete.
