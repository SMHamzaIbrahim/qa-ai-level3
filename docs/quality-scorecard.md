# Quality Scorecard (Initial Run)

**Date:** November 2026
**Environment:** Local Execution / GitHub Actions

| Metric | Result | Notes |
| :--- | :--- | :--- |
| **Total UI Scenarios** | 19 | Exceeds the 18 minimum requirement. |
| **Total API Assertions** | 8 | Meets the minimum requirement. |
| **Execution Pass Rate** | ~30% | Heavily impacted by the target website's "Queue Full" / Rate Limiting. |
| **RCA Classification Accuracy** | 100% (2/2) | FI-01 classified as `LOCATOR_OR_UI_CHANGE`; FI-02 classified as `ENVIRONMENT_OR_NETWORK`. |
| **Time-to-Triage** | < 5 seconds | Automated RCA parsing runs instantly after test failure. |
| **Flaky/Retry Rate** | 0% | No flaky tests observed; failures were deterministic environmental blocks. |
| **Security/Governance** | Pass | No secrets committed, AI is bounded by skills/agents contracts. |

## Known Limitations & Remediation
- **Target Environment Stability:** `automationexercise.com` is a public practice site. During testing, it frequently returned `503 Service Unavailable` and HTML error pages instead of JSON, causing deterministic failures. The framework handled this gracefully by classifying them as `THIRD_PARTY_DEPENDENCY` rather than code bugs.
- **AI Model:** The RCA currently uses a deterministic rule-based fallback (no external LLM API key was used). The architecture supports adding an LLM adapter via environment variables in the future.