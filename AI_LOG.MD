# AI Usage Log

This file details how AI tools (Claude and Gemini) were used to generate the backend test suite and how the frontend reactive logic was supervised.

---

## 1. Generating the test suite

**Prompt:** _"Generate an Express project from the requirements in the PDF"_ (tests were generated as part of this)

The AI generated a full Vitest suite covering controllers, services, and middlewares. The output was reviewed and two corrections were needed before reaching 100% coverage:

**Boundary condition in `updateStatus`:** The AI generated the high-severity guard using `description.length < 100` instead of `<= 100`. The spec states "more than 100 characters", meaning a description of exactly 100 characters must still be rejected. The test was rewritten to explicitly assert that `length === 100` fails and `length === 101` passes.

**Missing branch in `ClaimService` tests:** The mock for `damageRepo.findByClaimId` returned an empty array by default, which meant the high-severity branch inside `updateStatus` was never reached. A dedicated test was added to inject a damage with `severity: "high"` and verify the guard triggers correctly.

**Integration tests (`totalAmount`):** The AI did not cover the case where a damage update changes only a non-price field (e.g., `part`). A test was added to assert that `claimRepo.updateTotalAmount` is not called a second time in that scenario, validating the optimisation in `DamageService.update` that skips recalculation when `price` is not part of the update payload.

All other generated tests (controllers, middleware, `HttpError`) were accepted without changes.

---
