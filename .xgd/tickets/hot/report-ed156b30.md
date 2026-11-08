---
uid: report-ed156b30
id: REPORT-11535
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-11-08T17:49:57.015408+00:00'
updated_at: '2026-11-08T17:49:57.015408+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-0d00566a
---

I fixed the stored-XSS finding: Marked Points never parses a drawing into the builder's page unless `validateSvg` accepts it. The three Marked Points suites pass (37 tests). I couldn't run lint or the type checker, and one updated browser test hasn't been run. The changes are left uncommitted for the workflow.

**What changed:**
1. **Critical: stored XSS in Marked Points SVG measurement**
   - `apps/control-app/src/builder/points.js`: a new `isMeasurable()` check runs the fetched SVG through `validateSvg` before measuring, both on the real `evaluateMeasure` path and when a suite injects `measure`. A refused drawing returns no measurement, so the `near:` line is left out (same as the existing catch branch) and the exact coordinates are kept. If the validator isn't supplied, the real path measures nothing.
   - `tools/generate/src/cli/assets.ts`: the existing validator, `packages/site-schema/src/svg.ts`, is now served to the browser as `/framework/site-schema-svg.js`. No second validator was written.
   - `apps/control-app/src/builder/main.js`: imports `validateSvg` and passes it in `api`, the same way `measureScript` is passed.
   - Upload ingestion, `promoteToSiteAsset` and the L1 renderer are unchanged, as the report asked.
2. **Warning: no test covered the real `evaluateMeasure` path**
   - `tests/test_UAT_FC_REQ-210_marked_points.test.ts` has a new group of three tests:
     - **Hostile drawing, nothing injected:** an SVG with `onload` and `<image onerror>` runs no handler (`__pwned` stays undefined), creates no shadow root, leaves nothing behind in the page, keeps its exact coordinates (10, 21), and has no `near:` line.
     - **Valid drawing, real path:** the validated bytes still reach the measuring script (one shadow root is created). This is also what shows the hostile test would catch a regression: without the check, the hostile drawing would take the same path.
     - **Valid drawing with `measure` injected:** it still gets `near` with `cap-top`, while a hostile drawing is never passed to `measure`.
   - The existing wiring test now also checks that `site-schema-svg` is served and imported.
3. **Knock-on test change:** `tests/reconciliation-marked-points-served-modules.test.ts` builds its `api` by hand, copying `main.js`. Without the validator it would get no `near:` line, so I added the validator to it. I made no assertion weaker.

**Not run:**
- That browser test needs Playwright, which can't launch in this sandbox; the quality gate will run it.
- Lint: there's no ESLint in `node_modules` and the npm registry is blocked.
- Type check: there's no root `tsconfig`.

The workflow's own quality run covers these.

**Confidence:** high that the critical finding and the test-coverage warning are fixed. The main risk is the browser test above, which I haven't seen run.