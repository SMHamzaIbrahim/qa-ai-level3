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

## Evidence collection status

Three genuine conversational AI correction examples are recorded above; two more are still required. Evidence 3 is a real assistant conversation, not an OpenAI API prompt/output pair. Model-free RCA records are not AI prompt examples.

The repository now supports model-backed RCA through OpenAI when the GitHub Actions secret is configured. A real provider request will save its sanitized, versioned prompt and validated output as `reports/rca/openai-evidence.json`. An opt-in synthetic provider smoke writes a separate `reports/rca/openai-smoke-evidence.json`; it is not a real application RCA or a qualifying correction example. Capture human challenges, corrections, and decisions only after an actual reviewed run.

## Historical regression correction (supporting context, not counted above)

In the recorded conversation, the user reported AE-04's missing logout state, AE-12's `2` versus `0.2` quantity total, AE-15 stopping before the address/invoice cases, and AE-18's missing product heading. The assistant reported a registration-flow correction, a currency parser fix and unit test, checkout/address/invoice assertions, and an AE-18 rerun that identified a public-site queue page rather than a code defect. The user then requested a full regression run; the assistant reported 34/34 passing and the user requested the change be pushed.

This is genuine human-guided regression history, but the available transcript does not preserve the exact prompt/output pair or an explicit approval of each correction. It is therefore not counted toward the five required prompt/correction examples.

The repository owner also identified a prior duplicate-`test`-declaration correction. The exact assistant output and correction transcript are not present in this evidence bundle, so that episode is not counted until its original interaction is attached.

| Evidence | Prompt and initial output | Human challenge and correction | Decision / reviewer |
| -------- | ------------------------- | ------------------------------ | ------------------- |
| 4        | Pending capture           | Pending capture                | Pending             |
| 5        | Pending capture           | Pending capture                | Pending             |
