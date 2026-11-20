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

## Evidence 5: Revising run #20 after inspecting UI traces

- **User prompt (recorded):**
  > and the fifth prompt/correction example may not qualify. The 17 UI timeouts from run #20 also remain unclassified.
  >
  > fix these
- **Initial assistant output:** Reported that the 17 timeouts were unclassified and that the fifth correction example might not satisfy the rubric.
- **Evidence-based correction:** Inspection of the retained run #20 Playwright traces found that both document-navigation attempts for all 17 UI scenarios returned HTTP 403 with `server=cloudflare` (34/34 responses). The previous analysis treated locator timeouts as evidence but did not inspect the response status in the traces. The RCA collector now preserves failed HTTP responses, and the deterministic analyzer emits a `THIRD_PARTY_DEPENDENCY` hypothesis at 0.85 confidence for this explicit Cloudflare signal, pending human review.
- **Reviewer decision:** The repository owner approved the 17-scenario `THIRD_PARTY_DEPENDENCY` hypotheses for the observed responses and confirmed that this trace-based conversational correction qualifies as the fifth correction example. The decision does not attribute a cause to the Cloudflare denials or claim an OpenAI API prompt/output pair.
- **Qualification:** This is a genuine conversational assistant correction, not an OpenAI API prompt/output pair. The trace proves the external 403 response, not why Cloudflare denied the requests.

## Evidence collection status

Four previous conversational correction examples and this fifth owner-confirmed exchange are documented above. Evaluator scoring remains independent; no evidence is represented as an OpenAI API prompt/output pair.

The earlier owner approval of the 10 explicit API HTTP 403 failures remains limited to those cases. The owner separately approved the new 17-scenario UI hypothesis based on the trace responses; see the [RCA human review record](./rca-human-review.md).

The repository now supports model-backed RCA through OpenAI when the GitHub Actions secret is configured. A real provider request will save its sanitized, versioned prompt and validated output as `reports/rca/openai-evidence.json`. An opt-in synthetic provider smoke writes a separate `reports/rca/openai-smoke-evidence.json`; it is not a real application RCA or a qualifying correction example. Capture human challenges, corrections, and decisions only after an actual reviewed run.
