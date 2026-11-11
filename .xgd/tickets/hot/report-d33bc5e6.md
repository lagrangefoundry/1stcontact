---
uid: report-d33bc5e6
id: REPORT-12602
type: report
title: 'Code Review: bundle-374f88d6'
created_by: xgd
created_at: '2026-11-11T03:41:28.604746+00:00'
updated_at: '2026-11-11T03:41:28.604746+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-374f88d6
  overrides_audited: 2
  trust_boundary_overrides: 0
  anchor_uid: bundle-374f88d6
---

# Code Review

**Result**: FAIL

## Summary
The free-coded work (BUG-80 stored-picture delivery, REQ-217 picture in the turn, BUG-76 account-chrome contract, REQ-228 one catalogue + ticket read, REQ-229 recipe reaches the site, BUG-84 rights gate) is well structured, wired in and green. One architecture violation blocks it: the BUG-84 rights gate on the Worker's `POST /api/import` route is unbounded by construction. On every import it lists, fetches and hashes every mirrored subresource of every one of the tenant's capture bundles from R2. Architecture Policy items 2, 31 and 35 forbid this.

2 overrides audited, 0 touched a trust boundary.

## Quality Gates
Lint: success. Build: success. Tests: pass (quality report 2026-11-11T03:28:32Z, after the last production change: push.ts in 4aeb1038ed at 03:27:58Z). Coverage: pass (overall success).

## External Interface Accessibility
New entry points are wired in:
- `chatLibrary` (REQ-228) is composed into `chatHost` (`router.ts` ~L469).
- The `ai-ticketing` shim is written by `buildControlAppAssets` and reported by `formatAssetReport`.
- `republishingRecipes` is wrapped into `sessionPicturesFor`.
- `reviseRecipe` now receives the renderer and the site store.
- `businessPath` is used for the material and drawing URLs.
- The `1c push` CLI passes `references: fsReferenceStore(...)` (`cli/index.ts:644`).
- The `/api/import` route calls `assertNotCaptureMirrored` and maps `MirroredAssetError` to 403.

No dead modules found.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| apps/control-app/src/router.ts:1703-1704 + tools/generate/src/store/asset-rights.ts:119-128 | Import-route rights gate does unbounded per-item R2 work on a Worker request. `references.list()` (r2-reference-store.ts:112-122) enumerates EVERY object key of every bundle to derive bundle names. Then for each bundle it lists `assets/` and does a sequential `bucket.get` + full `arrayBuffer()` + SHA-256 of every member. Cost is O(captures x mirrored subresources) R2 GETs and bytes hashed per push, and it grows with the business's capture history. This violates Architecture Policy #35 (no per-item store query inside a loop over a business's items), #2 (Workers handle bounded requests only) and #31 (work that grows with the business does not run on a Worker). The comment in asset-rights.ts acknowledges Worker CPU/memory limits but only narrows the scan to the `assets/` prefix, which is still unbounded. | Critical |
| apps/control-app/src/router.ts:449-455 | Inline drawing-URL closure with a scheme regex. Would read better as a named helper beside `businessPath` in scope.ts. | Minor |
| .xgd/quality.yaml | Shown as deleted in main..HEAD. Traced to tool commit 595e8eef1c (xgd sync_main), not the free-coded work. Noted, not a project finding. | Info |

Other production changes (material.ts `promoteToSiteAsset`/`republishMaterial`/`placed_as`, library.ts, scope.ts `businessPath`, tickets.ts `placed_as`, push.ts `rightsRefusal`, screenshot.ts `rasterizeImage`) reuse existing helpers. Their loops are bounded: by the sites a material is placed on, and by the client's own incoming assets. No debug code, TODO stubs or duplicated projections (`storedImageOf` was extracted rather than copied).

## Checklist Compliance
No architecture_checklist, security_checklist or design_checklist reports exist, so those sections were skipped. The finding above is judged against the Architecture Policy in system knowledge.

## Mode Override Audit
2 overrides audited, 0 touched a trust boundary.

- **report-d8f8a034** (code_frozen, story-aacb7060, push.ts):
  1. Commit 4aeb1038ed touched only push.ts in production (the other files are tests). PASS.
  2. Quality pass postdates the change. PASS.
  3. Consistent with BUG-84 / AC-2589: the rights 403 names the asset and bundle, with no Access or --force advice. PASS.
  4. Within the grant's scope (message only; 401, redirect, non-rights 403 and 409 branches unchanged; parsing is defensive). PASS.
  5. The diff alters only an error string. Planner declared no trust boundary and no auth, escaping or credential path changed. PASS.
  6. Rung 1 (BUG-84 in scope); no unnamed files and no behaviour beyond the AC. PASS.
- **report-c0389fea** (code_frozen, story-58b2cec4, screenshot.ts):
  1. `unnamed_files_touched` is empty. PASS.
  2. Quality pass. PASS.
  3. Matches BUG-80 / AC-2565 (the shot and the lease failure become a bounded ImageNotRenderableError). PASS.
  4. Exactly the planner's instructions: decode refusal not re-wrapped, the `finally` still closes the driver, only screenshot.ts edited. PASS.
  5. `trust_boundary_touched` is false. PASS.
  6. Rung 1; conformance_verdict pass. PASS.

## Smoke Test
Entry points: `1c push` (CLI) and `POST /api/import` (Worker). Not invoked directly: this session's shell permissions do not allow running the CLI. The UATs drive the real `run(['push', ...])` CLI entry (`tests/test_reconciliation_site_asset_push_rights_gate.test.ts`) and the real import route (`tests/test_UAT_FC_BUG-84_import_rights_gate.workers.test.ts`), and both pass.

## Issues Found
**Critical (must fix)**:
- The Worker import route's rights gate is unbounded (router.ts:1703-1704 -> asset-rights.ts:119-128 -> r2-reference-store.ts:112-122). Every push does full R2 reads and SHA-256 of every mirrored member of every capture bundle the tenant holds. Architecture Policy #2, #31 and #35.

**Warnings (should fix)**:
- Extract the drawing-URL closure in router.ts:449-455 into a named helper next to `businessPath`.

## Fix-It Prompt
Make the BUG-84 rights gate bounded by construction on the Worker, keeping its semantics: refuse by content hash, no override, 403 with `{ error, slug, asset, bundle, member }`, checked after the 409 and before `createDraft`.

1. Record each mirrored subresource's sha256 when it is written into a capture bundle's `assets/` prefix, so hashes never have to be recomputed at import time. Options: a D1 table (tenant_id, sha256, bundle, member) written by the capture/adopt path, or R2 `customMetadata` / `checksums.sha256` set on put plus a per-bundle hash manifest member. Reuse the existing reference-store write path; do not add a parallel store.
2. Change `assertNotCaptureMirrored` (tools/generate/src/store/asset-rights.ts) to hash only the incoming assets, then make ONE bounded lookup of those hashes against the index (e.g. a single `SELECT ... WHERE tenant_id = ? AND sha256 IN (...)`, chunked by the incoming asset count, which the request bounds). No `references.list()` walk, no per-member `bundle.read`, no sequential loop over bundles.
3. Extend the `ReferenceStore` port with the lookup (e.g. `findMirrored(hashes): Promise<{sha256, bundle, member}[]>`). Implement it in r2-reference-store.ts (indexed), memory-reference-store.ts and fs-reference-store.ts (the fs adapter may compute or cache locally; it runs on the operator's laptop). `1c push` and `/api/import` keep sharing the one predicate.
4. Captures that predate the index: add a one-off backfill that runs as a background job (Workflow/container per Architecture Policy #8/#31), not inline in the import request.
5. Keep the existing UATs green (test_UAT_FC_BUG-84_import_rights_gate.workers, test_UAT_FC_BUG-84_mirrored_assets, test_reconciliation_site_asset_import_rights_gate.workers, test_reconciliation_site_asset_push_rights_gate). Add a UAT that plants a capture through the real write path and asserts the import route refuses its bytes without reading bundle members (e.g. an R2 double that fails any `get` under a bundle's `assets/` prefix during import).
