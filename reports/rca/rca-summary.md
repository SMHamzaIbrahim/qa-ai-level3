# Root Cause Analysis Report

**Failures analyzed:** 0
**Controlled fault exercises:** 2 (human review pending)

## FI-01
- **Classification:** `TEST_SCRIPT_DEFECT` (85% confidence)
- **Status:** HYPOTHESIS_PENDING_REVIEW
- **Symptom:** expect(received).toBe(expected) // Object.is equality
- **Retries:** 0
- **Validation:** Compare the injected assertion with the observed value, then rerun the corrected assertion.
- **Recommended action:** Correct only the test expectation or locator supported by the captured evidence.
- **Human approval required:** YES
- **Run:** Not available
- **Commit:** Not available

## FI-02
- **Classification:** `ENVIRONMENT_OR_NETWORK` (95% confidence)
- **Status:** HYPOTHESIS_PENDING_REVIEW
- **Symptom:** page.goto: net::ERR_FAILED at https://automationexercise.com/
- **Retries:** 0
- **Validation:** Verify the locally intercepted request-failure event and confirm no product request was sent.
- **Recommended action:** Remove the test-only route interception and rerun the isolated scenario.
- **Human approval required:** YES
- **Run:** Not available
- **Commit:** Not available
