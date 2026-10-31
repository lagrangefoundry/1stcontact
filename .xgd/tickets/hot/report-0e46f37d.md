---
uid: report-0e46f37d
id: REPORT-7169
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T23:47:49.365614+00:00'
updated_at: '2026-10-31T23:47:49.365614+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `apps/control-app/src/router.ts` (UU, code file, rule 2c). There were two hunks:
  - Import block: non-overlapping, so combined (2c.2). Kept HEAD's (REQ-166) `fidelityDeps`, `BrowserLauncher`, `HostDeps` and `r2ReferenceStore` imports, which are all still used. Took incoming's `sessionTextDescriber` import, which `defaultTextDescriber` needs.
  - `/api/ai/prompt`: both sides changed this independently, so integrated (2c.3b). Kept HEAD's `chatHost(env, deps, url.origin)`, because `chatHost` now requires `origin` on HEAD and dropping it would not compile. Took incoming's `scrub` in place of the inline `redactor(secretsOf(env))`, following REQ-173's hoisted scrubber (REQ-146 AC4).
- `tests/test_UAT_FC_REQ-161_material_surface.workers.test.ts` (DU, rule 2a/2f): restored the incoming version.
- `tests/test_UAT_FC_REQ-163_ingestion.workers.test.ts` (DU, rule 2a/2f): restored the incoming version.
- `tests/test_UAT_FC_REQ-163_material_pipeline.test.ts` (DU, rule 2a/2f): restored the incoming version.
  - Why: `git log HEAD -- <path>` shows these files never existed in HEAD's history. No refactor on HEAD documents removing them, so this is not a legitimate deletion and the 2a default applies (restore). The code they exercise IS on HEAD (`builder/library.js`, `material.ts` `ingestUpload`/`ingestFetch`), brought in by the REQ-172/BUG-47/REQ-166 merges. No equivalent tests exist under other names (git grep for `UAT_FC_REQ-16[13]` in HEAD:tests/ finds nothing).
  - FLAG FOR POST-MERGE REVIEW: these tests came in with their full REQ-161/REQ-163 content plus REQ-173's updates. Confirm they pass on this branch.

## Incoming changes preserved

router.ts: every hunk of `git diff 28b4105592^1 28b4105592` is present. That covers the `DescribeText` import and `describeText` dep, `defaultTextDescriber`, `aiConfigured`, `AI_STATUS_PATH`, the `GET /api/status` route, `NO_API_KEY_MESSAGE`, both 503 gates on upload and fetch, `text_comment` in the ingest response, the single hoisted `scrub` (the old per-catch declarations are gone), and `scrub` passed to `streamTurn`. No conflict markers remain.
The three test files are the incoming version verbatim. No hunk was dropped under BUG-1301.
Typecheck: `tsc --noEmit` on apps/control-app reports no router.ts errors. The only errors are missing `./generated/*` modules that are absent from this sparse checkout, which is environmental.
