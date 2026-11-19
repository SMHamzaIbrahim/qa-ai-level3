# Requirements-to-Test Traceability Matrix

| ID | Risk | Scenario / Goal | Layer | Source Ref | Automation File | Status |
|---|---|---|---|---|---|---|
| AE-01 | P0 | Account registration | UI | TC 1 | `tests/ui/auth.spec.ts` | ⚠️ Blocked (Site Queue) |
| AE-02 | P0 | Valid login / logout | UI | TC 2,4 | `tests/ui/auth.spec.ts` | ⚠️ Blocked (Site Queue) |
| AE-03 | P0 | Invalid login | UI/API | TC 3; API 10 | `auth.spec.ts`, `account.spec.ts` | ⚠️ Blocked (API HTML) |
| AE-04 | P1 | Duplicate registration | UI | TC 5 | `tests/ui/auth.spec.ts` | ⚠️ Blocked (Site Queue) |
| AE-05 | P1 | Login API validation | API | API 7,8,10 | `tests/api/account.spec.ts` | ⚠️ Blocked (API HTML) |
| AE-06 | P0 | Product catalogue | UI/API | TC 8; API 1 | `catalog.spec.ts`, `products.spec.ts` | ⚠️ Blocked (API HTML) |
| AE-07 | P0 | Search relevance | UI/API | TC 9; API 5 | `catalog.spec.ts`, `products.spec.ts` | ⚠️ Blocked (API HTML) |
| AE-08 | P1 | Search empty/invalid | UI/API | Discovery | `catalog.spec.ts`, `products.spec.ts` | ✅ Passed (UI) |
| AE-09 | P1 | Category filtering | UI | TC 18 | `tests/ui/catalog.spec.ts` | ✅ Passed (UI) |
| AE-10 | P1 | Brand filtering | UI/API | TC 19; API 3 | `catalog.spec.ts`, `products.spec.ts` | ⚠️ Blocked (API HTML) |
| AE-11 | P0 | Cart multiple items | UI | TC 12 | `tests/ui/cart.spec.ts` | ✅ Passed (UI) |
| AE-12 | P0 | Quantity calculation | UI | TC 13 | `tests/ui/cart.spec.ts` | ✅ Passed (UI) |
| AE-13 | P0 | Remove from cart | UI | TC 17 | `tests/ui/cart.spec.ts` | ✅ Passed (UI) |
| AE-14 | P0 | Cart persists on login | UI | TC 20 | `tests/ui/cart.spec.ts` | ✅ Passed (UI) |
| AE-15 | P0 | End-to-end order | UI | TC 14-16 | `tests/ui/checkout.spec.ts` | ⚠️ Blocked (Site Queue) |
| AE-16 | P0 | Address consistency | UI | TC 23 | `tests/ui/checkout.spec.ts` | ⚠️ Blocked (Site Queue) |
| AE-17 | P1 | Invoice download | UI | TC 24 | `tests/ui/checkout.spec.ts` | ⚠️ Blocked (Site Queue) |
| AE-18 | P1 | Product review | UI | TC 21 | `tests/ui/ancillary.spec.ts` | ⚠️ Blocked (Site Queue) |
| AE-19 | P1 | Contact form upload | UI | TC 6 | `tests/ui/ancillary.spec.ts` | ⚠️ Blocked (Site Queue) |
| AE-20 | P2 | Subscriptions | UI | TC 10,11 | `tests/ui/ancillary.spec.ts` | ⚠️ Blocked (Site Queue) |
| AE-21 | P2 | Recommended items | UI | TC 22 | `tests/ui/ancillary.spec.ts` | ⚠️ Blocked (Site Queue) |
| AE-22 | P1 | Account API CRUD | API | API 11-14 | `tests/api/account.spec.ts` | ⚠️ Blocked (API HTML) |
| AE-23 | P1 | API method validation | API | API 2,4 | `tests/api/account.spec.ts` | ⚠️ Blocked (API HTML) |
| AE-24 | P1 | UI/API consistency | UI/API | API 1,3 | *Covered by dual assertions in UI/API suites* | ⚠️ Blocked |

**Note on Status:** Failures are currently classified as `THIRD_PARTY_DEPENDENCY` (Automation Exercise is queueing traffic and returning 503 HTML pages to API calls). Scripts are structurally valid and have passed typechecking.