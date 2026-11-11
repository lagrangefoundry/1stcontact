---
uid: report-5c6f435c
id: REPORT-12603
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-11-11T03:47:59.608103+00:00'
updated_at: '2026-11-11T03:47:59.608103+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-374f88d6
---

I've fixed both review findings. The import route's rights gate no longer lists, reads or hashes any capture bundle in R2, and the 16 affected test files pass (134 tests). Nothing is committed; I've left the changes for the workflow, which runs the quality checks next.

**Critical: the rights gate grew with the business's capture history (Architecture Policy #2, #31, #35)**
- **Hash recorded on write:** `tools/generate/src/store/r2-reference-store.ts` now records each mirrored file's sha256 at the moment it's written into a bundle's `assets/` folder. The record lives at `t/<tenant>/ref/.mirrored/<sha256>` and says which bundle and member it came from.
  - The record is written before the file itself, so a write that fails halfway leaves a refusal, never an unrecorded mirror.
  - It sits under `t/<tenant>/ref/`, so deleting a business's data removes it too. The bundle listing skips it, because a name starting with `.` can't be a host.
- **New lookup on the port:** `ReferenceStore.findMirrored(hashes)` in `reference-store.ts`.
  - On R2 it does one keyed read per distinct incoming hash, so the cost depends on the push, not on how many captures the business holds.
  - The memory and filesystem versions (tests and `1c push` on the operator's laptop) still scan the bundles, through one shared `scanMirrored` helper.
  - `sha256Hex` moved into `reference-store.ts`; `asset-rights.ts` re-exports it.
- **The gate itself:** `assertNotCaptureMirrored` in `asset-rights.ts` now hashes only the incoming assets and makes the one `findMirrored` call. It still names the first offending asset in the order the push sent them. The 403 body, the lack of any override, and its place after the 409 check and before `createDraft` are unchanged.
- **Captures from before this change:** these have no recorded hashes yet. `apps/control-app/src/mirrored-backfill.ts` adds a backfill driven by a new 5-minute Cron Trigger: a `scheduled` handler in `index.ts` and `[triggers]` blocks at the top level and under `[env.production]` in `wrangler.toml`.
  - Each run handles at most 50 keys, and keeps its place in R2 at `ops/mirrored-index-backfill.json`. It never runs inside an import request.
  - Once finished, each later run costs a single read.
- **New UAT:** `tests/test_UAT_FC_BUG-84_bounded_rights_gate.workers.test.ts` plants a capture through the real write path. It then runs the import against a bucket wrapper that throws on any read or listing inside a bundle.
  - It asserts a 403 naming the asset, bundle and member, with nothing inside a bundle touched, and that a clean push is still accepted.
  - A second test plants a file the old way (no hash recorded), runs the real Cron step until it finishes, then asserts the import is refused, still without reading a bundle.
  - The old code would fail this test, because it lists the bundles.

**Warning: inline drawing-URL closure in `router.ts:449-455`**
- It is now a named helper, `draftAssetPath(businessId, slug, handle)`, next to `businessPath` in `apps/control-app/src/scope.ts`, and the router calls it.

**Checks I ran**
- The new UAT plus the four existing BUG-84 tests: 16/16 pass.
- Reference-store, capture, wrangler-config, picture-in-the-turn and access-gate suites: 134/134 pass.
- `tsc` on the control app shows no new errors. Three errors remain: a duplicate `IMAGES` field in `router.ts` that is already on main. `tsc` on `tools/generate` also reports missing type declarations for `apps/control-app/src/builder/*.js` modules, in files this fix didn't touch.
- No lint tool is configured in the repo, so I couldn't run lint.

**Confidence:** high that the review passes. The one judgement call is the backfill: it runs as a Cron Trigger in the Worker rather than a Workflow or container, because the repo has no Workflow or container setup yet. Each run is capped at 50 keys, which Policy #8 allows, but a reviewer applying #31 strictly could ask for a container instead.