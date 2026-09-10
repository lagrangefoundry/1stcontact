---
uid: comment-f3e9c904
id: COMMENT-2483
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T06:48:35.321785+00:00'
updated_at: '2026-09-10T06:48:35.321785+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4ac04d1b
  kind: note
---

Attempt 2 complete — report **REPORT-3684 (report-4ac04d1b)**, 9 mutations, 0 violations remaining.

**The violation (finding 1) is resolved by removal, not restatement.** AC-1385's "Named exception" claimed the render questions were answered by the filesystem-hosted stores only, "because the render still runs through a build transform the Workers runtime has none of." Before writing a replacement I checked the tree: `PreviewRenderer` takes a `SiteStore` and nothing else (`tools/generate/src/cli/preview.ts:88-95, 107-129`), and `SiteStore` (`site-store.ts:164-250`) has no render verb — which is the real reason the render sits outside the compared answer vector, and it's a property of the port, not a runtime.

Then I tested the premise instead of arguing it: moved the two preview cases into `describeSiteStoreContract` and ran the workers project.

```
✓ |workers| … over the D1/R2 store > test_UAT_AC1385_the_draft_renders_from_whatever_store_served_it 12ms
✓ |workers| … over the D1/R2 store > test_UAT_AC1385_a_preview_asset_comes_back_as_bytes 11ms
```

The cloud adapter answers both. So finding 4's opportunistic move is kept, and AC-1385 declares no exception at all now — the render is asked of all three stores from the one body, which is the property the capability's own text claims.

**The retired fact had six carriers, not three.** Findings 2 and 3 named `storage-questions.ts`, `site-store-contract.ts` and `test_UAT_FC_REQ-142_…`; a sweep for `build transform` / `container API` / `REQ-145's scope` turned up two more inside this capability — `test_UAT_FC_REQ-143_d1r2_store.workers.test.ts:308` and `test_UAT_FC_REQ-143_render_store_independence.test.ts:19` — plus the comment inside AC-1385's own test. All six now state the port-shape reason and cite AC-1395/AC-1447 as the evidence that workerd renders. The four carriers in other capabilities were left alone per the report's scope note.

**Verification:** all 8 suites this capability owns, both runtimes — 99 tests passed, nothing regressed. No production code was touched; `uat_coverage` was deliberately left to the coverage check.
