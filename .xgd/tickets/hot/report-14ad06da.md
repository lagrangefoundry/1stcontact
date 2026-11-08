---
uid: report-14ad06da
id: REPORT-11324
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T06:59:52.116794+00:00'
updated_at: '2026-11-08T06:59:52.116794+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-39c992d3
  parent_report_uid: report-a313553e
  batch_index: '0'
---

The failing test, `test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor`, now passes. The fix is in `apps/control-app/src/imagegen.ts` only, the one file the exception allowed; no tests or tickets were changed.

**Cause:** when the model asked for a 21:9 picture, the framework's error detail read `Backend "openai" does not support "aspectRatios": …`. The tool runtime appends that detail to the tool result as `The host reports: …`, so the model saw the vendor name.

**Fix:** `imageSurface()` now wraps the plugin's two operations, `create_image` and `edit_image`, with a new `vendorless()` helper. When either operation fails, the error text is rewritten before the model sees it:
- `Backend "<name>"` becomes "This generator".
- Any other mention of the provider (`openai`), the backend's name or the model id (`gpt-image-1`) becomes "the generator", ignoring case.

The error keeps its code and type. So the declared sentence "That is not a shape this generator offers." and the list of ratios the generator does offer still reach the model. The generated `ai-imagegen.js` and the framework plugin are untouched.

One difference from the planner's notes: they mention an existing `meteredDraws` wrapper in this file. It doesn't exist, so the new wrapper sits where `imageSurface()` puts the plugin together.

**Checks run:**
- Tests: `tests/reconciliation-consultant-image-generation.workers.test.ts` (the AC2379–AC2391 tests) and the REQ-208 FC file, run together in workerd: 25 of 25 passed.
- Type check: `tsc --noEmit` on control-app passed.
- Lint was not run. The repo has no lint script and no local ESLint, and the sandbox blocked downloading it from registry.npmjs.org.

## Assessment
```yaml
status: fixed
failures:
  - test: tests/reconciliation-consultant-image-generation.workers.test.ts::test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor
    status: fixed
    change: "apps/control-app/src/imagegen.ts — vendorless() wraps create_image/edit_image and scrubs provider/backend/model names from error message and detail; code, class, declared message and the supported-ratio list are kept"
    evidence: "vitest workers run: 2 files, 25/25 tests passed; tsc --noEmit clean"
exception_used: code_frozen (imagegen.ts only)
upstream_changes: none
```