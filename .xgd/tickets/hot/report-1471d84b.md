---
uid: report-1471d84b
id: REPORT-12040
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T22:23:33.737895+00:00'
updated_at: '2026-11-09T22:23:33.737895+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-58b2cec4
  parent_report_uid: report-45273bd1
  batch_index: '1'
---

The AC-2565 failure is fixed: when the browser fails while taking the final shot of a stored picture, the result is now the short, size-capped refusal sentence instead of the raw driver error.

**Code change** (`tools/generate/src/cli/capture/screenshot.ts`, the only file the exception allowed):
- `rasterizeImage` now has one helper, `unrenderable(err)`, that builds the bounded "could not be put in front of the browser" refusal with the cleaned-up driver message.
- That helper now also covers the browser lease (`factory()`) and `driver.screenshot(...)`. Before, it only covered navigation, chunk delivery and the decode query.
- The deliberate "the browser would not decode it" refusal is still thrown outside the wrapped regions, so its wording (which the AC2485 tests check) is unchanged.
- The `finally` still closes the browser whenever one was leased, including when the shot fails.

**Verification:**
- The three test files covering this scope pass, 31 tests in all: `reconciliation-stored-picture-delivery`, `reconciliation-assistant-sees-a-stored-picture` and `reconciliation-assistant-looking-surface`. This includes `test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released`.
- I did not run the workerd test files (`*.workers.test.ts`) that hold the Worker-side AC2031 checks; this change doesn't touch the code they exercise.
- `tsc` on `tools/generate` reports no errors in `screenshot.ts`. It does fail on unrelated errors in `apps/control-app`, such as missing declarations for `./builder/*.js` and a duplicate `IMAGES` in `router.ts`.
- ESLint did not run: `npx` tried to fetch it and the sandbox blocks the npm registry.

**Upstream:** I updated AC-2565 (`acceptance_criterion-57778c84`) to say case (c) is now met and to include the browser lease in the criterion. The story (`story-58b2cec4`) still has its "two browser interactions on the stored-picture path are not wrapped (BUG-80)" note, which is now out of date. I didn't rewrite that long story body in this batch; it should be marked resolved, as the other flagged issues are.

```yaml
## Assessment
status: fixed
files_changed:
  - tools/generate/src/cli/capture/screenshot.ts
tickets_updated:
  - acceptance_criterion-57778c84
tests: "31/31 passed across reconciliation-stored-picture-delivery, reconciliation-assistant-sees-a-stored-picture, reconciliation-assistant-looking-surface (incl. AC2565); workerd test files not run"
lint: "not run: npm registry blocked by the sandbox"
typecheck: "no errors in screenshot.ts; tsc on tools/generate fails on unrelated apps/control-app errors"
```