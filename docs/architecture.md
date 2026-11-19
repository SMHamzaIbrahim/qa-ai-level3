# Automation and RCA Architecture

```mermaid
flowchart LR
    Trigger["GitHub push / PR / manual / 00:00 UTC schedule"] --> CI["GitHub Actions"]
    CI --> Tests["Playwright test runner"]
    Tests --> POM["UI page objects"]
    Tests --> API["Typed AutomationExercise API client"]
    POM --> Fixtures["Per-test user and cleanup fixtures"]
    API --> Fixtures
    Tests --> Results["Playwright JSON / JUnit / HTML"]
    Tests --> Media["Failure trace / screenshot / video"]
    Results --> Collector["RCA collector"]
    Media --> Collector
    Collector --> Bundle["Sanitized failure records + retry/run/commit metadata"]
    Bundle --> Classifier["Model-free RCA rules + confidence policy"]
    Classifier --> RCA["Validated JSON schema + Markdown"]
    Results --> Upload["GitHub artifact upload (14-day retention)"]
    Media --> Upload
    RCA --> Upload
    RCA --> Review["Human review / release decision"]
    Review --> Patch["Reviewed patch in a separate PR"]
    Patch --> CI
```

## Interfaces and boundaries

- **Inputs:** scenario IDs and risk tags, Playwright JSON results, stack traces, retry attempts, and artifact paths.
- **Test interfaces:** page objects use the browser `Page`; `AutomationExerciseApi` uses a request context rooted at `API_URL`; fixtures provide unique accounts and attempt account deletion during teardown.
- **RCA interface:** the collector writes `failures.json` plus collection status; the analyzer validates each record against the exported Zod schema and writes `rca-report.json` and `rca-summary.md`.
- **Outputs:** Playwright JSON/JUnit/HTML reports, failure media, and the structured RCA bundle are uploaded as one workflow artifact.
- **Current AI boundary:** RCA is deterministic and model-free. The repository does not currently call an external model or run autonomous agents.
- **Stop conditions:** missing evidence yields `UNKNOWN` or a pending hypothesis; low confidence and controlled fault injections require human review. No agent may merge or deploy a patch.

The skills and orchestrator documents describe the proposed human-supervised workflow; they are contracts, not an autonomous agent runtime.
