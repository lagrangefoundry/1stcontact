---
uid: report-c49cd81a
id: REPORT-12606
type: report
title: 'Code Review: bundle-374f88d6'
created_by: xgd
created_at: '2026-11-11T03:58:27.893549+00:00'
updated_at: '2026-11-11T03:58:27.893549+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-374f88d6
  overrides_audited: 2
  trust_boundary_overrides: 0
  anchor_uid: bundle-374f88d6
---

# Code Review

**Result**: PASS

## Summary
The previous review (report-d33bc5e6) found one critical problem: the BUG-84 rights gate on `POST /api/import` listed, read and hashed every mirrored member of every capture bundle the business holds. That is fixed (d764d45c9c). Each mirrored member's sha256 is now recorded when it is written into a bundle, and the gate hashes only the incoming assets and does one keyed lookup per distinct hash. The minor drawing-URL finding was also addressed. Everything else in the bundle (BUG-80, REQ-217, BUG-76, REQ-228, REQ-229, BUG-84) is wired in and green.

2 overrides audited, 0 touched a trust boundary.

## Quality Gates
Lint: success. Build: success. Preflight: pass. Overall: success (quality report 2026-11-11T03:48:57Z, after the last production change in d764d45c9c).

## External Interface Accessibility
Yes, the new pieces are wired in:
- `ReferenceStore.findMirrored` is implemented by all three adapters: r2 (indexed), and memory and fs (both scanning through the shared `scanMirrored` helper).
- `assertNotCaptureMirrored` uses `findMirrored`, and the import route still maps `MirroredAssetError` to a 403.
- `runMirroredBackfillTick` is called from the new `scheduled` handler (apps/control-app/src/index.ts:424-427).
- The cron is declared at the top level and under `[env.production]` in wrangler.toml.
- `draftAssetPath` lives in scope.ts and the router calls it.

Earlier wiring is unchanged: `chatLibrary` in `chatHost`, the ai-ticketing shim, `republishingRecipes`, and `1c push` passing `references`.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| tools/generate/src/store/r2-reference-store.ts:56-95,123-127 | The index is written before the member (a crash leaves a safe refusal). It sits under `t/<tenant>/ref/` so erasure removes it. A leading `.` keeps it out of bundle listing. Good. | OK |
| tools/generate/src/store/r2-reference-store.ts:176-189 | `findMirrored` does one GET per distinct, hex-validated hash. Its cost is set by the request. | OK |
| tools/generate/src/store/r2-reference-store.ts:241-257 + apps/control-app/src/mirrored-backfill.ts | The backfill handles one list page of at most 50 keys per run and keeps its cursor in R2, so progress survives a killed run (guards read stored state). It runs as a Worker Cron Trigger, not a Workflow or container. Each run is bounded, so #35 and #8 are met, but a strict reading of #31 (work that grows with the business) would prefer a Workflow or container step. Each member is also read whole into memory to hash it. | Warning |
| tools/generate/src/cli/capture/screenshot.ts:316-374 | Every driver call (lease, navigate, chunk delivery, decode query, shot) goes through one `unrenderable()` wrapper. The decode refusal is not re-wrapped, and `finally` closes the driver. | OK |
| tools/generate/src/cli/push.ts:190-262 | `rightsRefusal` parses defensively. The 401, redirect, non-rights 403 and 409 branches are unchanged. | OK |
| .xgd/quality.yaml | Shows as deleted in main..HEAD. This comes from the tool's sync_main commit 595e8eef1c, not the free-coded work. | Info |

No debug code, TODO stubs or duplicated logic. `sha256Hex` moved into reference-store.ts and is re-exported, not copied.

## Checklist Compliance
There are no architecture_checklist, security_checklist or design_checklist reports, so those sections were skipped. The Architecture Policy was applied directly: #2, #31 and #35 now hold for the import request path.

## Mode Override Audit
2 overrides audited, 0 touched a trust boundary.

- **report-d8f8a034** (code_frozen, story-aacb7060, push.ts):
  1. Commit 4aeb1038ed changed only push.ts in production code; the rest are tests and ticket files. PASS.
  2. The quality pass postdates the change. PASS.
  3. It matches BUG-84 / AC-2589: the rights 403 names the asset, bundle and member, with no Access or --force advice. PASS.
  4. Message only, within the grant's scope. PASS.
  5. No escaping, auth or credential path changed, and none was declared. PASS.
  6. Rung 1, no file outside the grant, and no behaviour beyond the AC. PASS.
- **report-c0389fea** (code_frozen, story-58b2cec4, screenshot.ts):
  1. `unnamed_files_touched` is empty. PASS.
  2. Quality pass. PASS.
  3. It matches BUG-80 / AC-2565. PASS.
  4. It follows the planner's instructions exactly: the decode refusal is not re-wrapped and `finally` is kept. PASS.
  5. `trust_boundary_touched` is false. PASS.
  6. Rung 1, conformance_verdict pass. PASS.

## Test Evidence
The new test `tests/test_UAT_FC_BUG-84_bounded_rights_gate.workers.test.ts` plants a capture through the real `r2ReferenceStore` write path into the real Miniflare R2 bucket. It then runs the real router behind a proxy that throws on any bundle read or list. It also covers a capture written before the index, using the real cron step. The proxy sits only at the R2 storage boundary, so there is no internal mocking.

## Smoke Test
Entry points: `1c push` (CLI), `POST /api/import` (Worker) and the `scheduled` handler. Not run directly: this session's shell does not allow running the CLI or Worker. The UATs drive the real `run(['push', ...])`, the real `route` and `runMirroredBackfillTick`, and all pass under the latest quality run.

## Issues Found
**Critical (must fix)**:
- None.

**Warnings (should fix)**:
- Consider moving the mirrored-index backfill from a Worker Cron Trigger to a Workflow or container step (Architecture Policy #31). It is bounded per run today, but each run reads up to 50 whole members into Worker memory to hash them.
