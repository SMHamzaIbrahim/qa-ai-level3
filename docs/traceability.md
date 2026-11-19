# Requirements-to-Test Traceability Matrix

| ID | Risk | Scenario / layer / source | Test data and expected outcome | Automation evidence | Status |
|---|---|---|---|---|---|
| AE-01 | P0 | Registration; UI; TC 1 | Generated user; account is created and logged-in identity matches the fixture. | `tests/ui/auth.spec.ts` | Pass |
| AE-02 | P0 | Valid login/logout; UI; TC 2, 4 | Created user; login succeeds, logout returns to login state. | `tests/ui/auth.spec.ts` | Pass |
| AE-03 | P0 | Invalid login; UI/API; TC 3, API 10 | Nonexistent credentials; both layers report authentication failure. | `tests/ui/auth.spec.ts`, `tests/api/account.spec.ts` | Pass |
| AE-04 | P1 | Duplicate registration; UI; TC 5 | Reuse a created test email; duplicate is rejected. | `tests/ui/auth.spec.ts` | Pass |
| AE-05 | P1 | Login API validation; API; API 7, 8, 10 | Generated account; create and valid login return expected response codes. | `tests/api/account.spec.ts` | Pass |
| AE-06 | P0 | Product catalogue; UI/API; TC 8, API 1 | Live catalogue; both layers return products with ID, name, and price. | `tests/ui/catalog.spec.ts`, `tests/api/products.spec.ts` | Pass |
| AE-07 | P0 | Search relevance; UI/API; TC 9, API 5 | Search for `Top`/`Tshirt`; results contain products and UI result matches the term. | `tests/ui/catalog.spec.ts`, `tests/api/products.spec.ts` | Pass |
| AE-08 | P1 | Empty/invalid search; UI/API; API 6 | Nonexistent UI term and omitted API parameter; no UI results and API reports bad request. | `tests/ui/catalog.spec.ts`, `tests/api/products.spec.ts` | Pass |
| AE-09 | P1 | Category filtering; UI; TC 18 | Women/Dress filter; heading and nonempty product grid match the selection. | `tests/ui/catalog.spec.ts` | Pass |
| AE-10 | P1 | Brand filtering; UI/API; TC 19, API 3 | Polo brand; UI grid and API brand list are nonempty. | `tests/ui/catalog.spec.ts`, `tests/api/products.spec.ts` | Pass |
| AE-11 | P0 | Multiple cart items; UI; TC 12 | Two distinct products; cart contains two lines. | `tests/ui/cart.spec.ts` | Pass |
| AE-12 | P0 | Quantity calculation; UI; TC 13 | Quantity four; line total equals unit price multiplied by quantity. | `tests/ui/cart.spec.ts` | Pass |
| AE-13 | P0 | Remove from cart; UI; TC 17 | One product; remove action leaves the cart empty. | `tests/ui/cart.spec.ts` | Pass |
| AE-14 | P0 | Cart persists on login; UI; TC 20 | Add item before registration; cart still contains it after account creation. | `tests/ui/cart.spec.ts` | Pass |
| AE-15 | P0 | End-to-end order; UI; TC 14–16 | Two distinct products, first at quantity four; totals, comment, dummy payment, and order confirmation are checked. | `tests/ui/checkout.spec.ts` | Pass |
| AE-16 | P0 | Address consistency; UI; TC 23 | Delivery and billing address fields match the generated account fixture. | `tests/ui/checkout.spec.ts` | Pass |
| AE-17 | P1 | Invoice download; UI; TC 24 | Download event yields a nonempty `.txt` or `.pdf`; content signature/text is checked. | `tests/ui/checkout.spec.ts` | Pass |
| AE-18 | P1 | Product review; UI; TC 21 | Invented reviewer data; review confirmation appears. | `tests/ui/ancillary.spec.ts` | Pass |
| AE-19 | P1 | Contact form upload; UI; TC 6 | Dummy text file and synthetic form values; success confirmation appears. | `tests/ui/ancillary.spec.ts` | Pass |
| AE-20 | P2 | Subscription; UI; TC 10, 11 | Synthetic email; subscription confirmation appears. | `tests/ui/ancillary.spec.ts` | Pass |
| AE-21 | P2 | Recommended items; UI; TC 22 | Recommended item; adding it exposes the cart link. | `tests/ui/ancillary.spec.ts` | Pass |
| AE-22 | P1 | Account API CRUD; API; API 11–14 | Generated account; create, update, read changed city, then delete. | `tests/api/account.spec.ts` | Pass |
| AE-23 | P1 | API method validation; API; API 2, 4 | Unsupported DELETE/POST/PUT methods; each returns the documented method error. | `tests/api/account.spec.ts` | Pass |
| AE-24 | P1 | UI/API consistency; integration; API 1, 3 | First visible product ID, name, and price agree across UI and API. | `tests/integration/product-consistency.spec.ts` | Pass |

## Verification note

The latest full-suite run used one worker with retries disabled: 34 of 34 tests passed. This includes all 24 traced scenarios, the local RCA/fault-injection checks, and the price parser unit test. The latest recorded GitHub run before remediation was [run 44579076564](https://github.com/SMHamzaIbrahim/qa-ai-level3/actions/runs/44579076564): 13 passed and 14 failed.
