# AI Prompt & Correction Evidence

## Evidence 1: Correcting Locators (AE-01)

- **Initial AI Output:** `page.getByRole('radio', { name: 'Mr' })`
- **Human Challenge:** "This fails in strict mode because it matches both 'Mr.' and 'Mrs.'."
- **Correction Applied:** Changed to `page.locator('#id_gender1')`.
- **Decision:** Approved because ID locators are stable and unique.

## Evidence 2: Handling CI Environment Failures

- **Initial AI Output:** Suggested `page.waitForTimeout(5000)` to fix API failures.
- **Human Challenge:** "The rubric strictly forbids fixed sleeps. The GitHub runner is being blocked by Cloudflare (403)."
- **Correction Applied:** Implemented `safeJson()` to parse HTML errors and fail gracefully, and added the RCA rule for `THIRD_PARTY_DEPENDENCY`.
- **Decision:** Approved. The pipeline now diagnoses the WAF block instead of hiding it with timeouts.

## Evidence 3: Rejecting an Unavailable Hosted-Model Dependency

- **Initial AI Output:** Suggested adding a local Ollama model to avoid the missing OpenAI credential.
- **Human Challenge:** "Do not use Ollama. Stick to the model-free deterministic fallback and improve the documentation to show the decision design."
- **Correction Applied:** Kept the assessment path model-free and documented the deterministic decision matrix, role handoffs, and human authority gates.
- **Decision:** The repository owner directed that the deterministic fallback remain the assessment mode.

## Evidence 4: User-reported regression gaps and full-suite decision

- **User prompt (recorded):**
  > AE-04: logout link not found after registration.
  > AE-12: quantity total expected `2`, but observed `0.2`.
  > AE-15: checkout stopped at the same line-total mismatch; AE-16 and AE-17 were not reached, so address and invoice behavior remain unverified.
  > AE-18: product detail heading did not appear during review navigation.
  >
  > run these scenarios again and if any fix is required do that please
- **Assistant output (recorded):** Reported changes to the registration helper, price parsing, checkout/address assertions, and diagnosis of the AE-18 queue page. It explicitly said the full suite had not yet been rerun.
- **Reviewer decision (recorded):** The owner then asked, “run all the test again now and see if all the cases are passed”. After the assistant reported 34/34 passing with retries disabled, the owner said, “push it to repo.”
- **Qualification:** This is a real guided correction and validation sequence. The follow-up authorized publishing after a green suite; it is not represented as a line-by-line code review or approval of each individual diff.

## Evidence 5: Narrowing the run #20 RCA decision

- **Initial output:** The deterministic analyzer marked 20 failures as `THIRD_PARTY_DEPENDENCY` and 7 as `LOCATOR_OR_UI_CHANGE`, pending review.
- **Human correction:** The repository owner approved only the 10 failures with explicit HTTP 403/non-JSON evidence as third-party response failures. The other 17 UI timeouts remain pending.
- **Reviewer decision:** The limited approval and its evidence boundary are recorded in the [RCA human review record](./rca-human-review.md).
- **Qualification:** This is review of model-free deterministic RCA output, not an OpenAI prompt/output example. Whether it satisfies the assignment's fifth prompt/correction example is for the evaluator to decide; no provider-backed output is claimed.

## Evidence collection status

Four genuine conversational correction examples are documented above. Evidence 5 is an additional human correction to deterministic RCA output, but may not satisfy a requirement specifically for an AI prompt/output pair. The repository owner should confirm evaluator acceptance; no evidence is represented as an OpenAI API prompt/output pair.

The repository now supports model-backed RCA through OpenAI when the GitHub Actions secret is configured. A real provider request will save its sanitized, versioned prompt and validated output as `reports/rca/openai-evidence.json`. An opt-in synthetic provider smoke writes a separate `reports/rca/openai-smoke-evidence.json`; it is not a real application RCA or a qualifying correction example. Capture human challenges, corrections, and decisions only after an actual reviewed run.
