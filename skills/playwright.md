# Skill: Playwright Automation

## Purpose
To generate maintainable, stable, and reliable Playwright/TypeScript code.

## Inputs
- Test scenarios from the test-design skill.
- Application DOM structure or existing Page Object Models (POM).

## Outputs
- TypeScript test files (e.g., `tests/ui/login.spec.ts`).
- Page Object Models (e.g., `src/pages/LoginPage.ts`).

## Rules & Guardrails
- **Locator Policy:** Prefer `getByRole`, `getByLabel`, `getByText` over CSS/XPath. Use `data-qa` attributes where available.
- **No Fixed Sleeps:** Never use `page.waitForTimeout()`. Use auto-waiting assertions (e.g., `expect(locator).toBeVisible()`).
- **No Blanket Force Clicks:** Do not use `{ force: true }` unless explicitly justified and documented.
- **Isolation:** Every test must generate its own unique user data. Do not share state between tests.
- **Cleanup:** Track disposable accounts before the create operation and delete them in fixture teardown, including on failure paths. Report cleanup failures explicitly.
- **API:** Use the typed `AutomationExerciseApi` client and its Zod-validated response schemas; keep endpoint paths relative to the configured `/api/` base URL.
- **Evidence:** Attach downloaded invoice and fault-injection evidence; never include real secrets, card data, or personal data.

## Human Checkpoint
All generated code must pass PR review, typechecking (`npx tsc --noEmit`), and CI before merging.