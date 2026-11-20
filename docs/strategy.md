# Test Strategy

## 1. Scope & Assumptions

- **In Scope:** UI flows (Auth, Catalog, Cart, Checkout, Contact), API flows (Auth, Products, Brands), and AI RCA failure analysis.
- **Out of Scope:** Load testing, security penetration testing, real monetary transactions.
- **Assumptions:** The target site (`automationexercise.com`) is a public practice site and may be subject to rate-limiting (WAF 403/503 blocks) during CI runs. Payment data is strictly dummy.

## 2. Risk Matrix

- **P0 (Critical):** Registration, Login, Cart Math, Checkout. (Must be automated, must have negative cases).
- **P1 (High):** Search, Brand filtering, Contact Form, API CRUD.
- **P2 (Medium):** Subscriptions, Recommended items.

The 24-scenario catalogue and source-to-test mappings are maintained in [traceability.md](./traceability.md). The UI suite covers 20 scenario IDs; AE-15/16/17 share the full purchase journey, and AE-24 is the UI/API integration scenario.

## 3. Test Design Approach

We utilize the Page Object Model (POM) for UI isolation and typed fixtures for API data. Every test generates a unique user (UUID) to prevent data pollution. Assertions go beyond visibility (e.g., checking cart arithmetic, verifying API JSON schemas).

## 4. AI & RCA Strategy

Failures are triaged into eight categories by OpenAI when `OPENAI_API_KEY` is configured on a trusted main-branch workflow; pull requests and missing credentials use the explicit deterministic fallback. Only bounded, redacted diagnostic text is sent; traces and page content are not. The versioned prompt and validated output are stored as a sanitized audit artifact. Every model-generated classification remains pending human review. Assertion mismatches alone are not sufficient evidence for a product defect, and the analyzer does not make patches or release decisions.

## 5. Coverage gaps and evidence

- The public site can block or vary responses; record the exact run and review traces before attributing failures. The repository owner approved Run #20's 17 trace-backed UI HTTP 403 responses as third-party hypotheses; the reason for the denials remains unknown.
- FI-01/FI-02 classification approvals, Run #20 review decisions, and FI-01 test-only patch validation are recorded in [rca-human-review.md](./rca-human-review.md). The repository owner confirmed the fifth conversational correction example; PR/scheduled-run evidence and live defense remain separate submission evidence. See [quality-scorecard.md](./quality-scorecard.md).
