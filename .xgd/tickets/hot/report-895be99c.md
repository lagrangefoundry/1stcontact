---
uid: report-895be99c
id: REPORT-3922
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-11T05:13:36.263938+00:00'
updated_at: '2026-09-11T05:13:36.263938+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-aacb7060
---

## What I found before writing anything

`git ls-tree HEAD` says the code this story is about is **not on the reconcile branch**:

- `apps/control-app/src/material.ts` (where `promoteToSiteAsset` lives), `describe.ts`, `fetch-guard.ts` and `knowledge.ts` are absent; `router.ts` on HEAD has no `/api/material` routes.
- `git merge-base --is-ancestor 855dd57a7c HEAD` → **false**. The REQ-163/REQ-161 commits were never replayed here. `kb-projection.ts` (REQ-165) *is* here, so the bundle landed partially.
- The same is true for plan items 7–9 — `tests/reconciliation-material-ingestion.workers.test.ts` and `reconciliation-guarded-fetch.workers.test.ts`, written by earlier iterations of this run, already fail with `Cannot find module '../apps/control-app/src/material'`.

A second, independent blocker: the installed `@lagrangefoundry/ticketing` now requires a `ticket_changes` table that no in-repo migration creates (not on HEAD, not at the bundle's own tip `f6c1366410`). Every ticket-store-backed workers suite on this branch dies with `D1_ERROR: no such table: ticket_changes` — I confirmed this on `reconciliation-product-ticket-store.workers.test.ts`, which doesn't touch this story at all.

I did not add the implementation and did not soften the ACs. I read the real implementation out of the bundle's own commit (`git show f6c1366410:apps/control-app/src/material.ts`, `:router.ts`) and grounded every assertion on it — the gate reading `ticket.fields.republishable`, `freeAssetName`'s suffix-before-extension rule, `readBlob`'s "no longer in storage" message, and `placeOnSite`'s `site_asset` / `site_asset_error` envelope through `redactor(secretsOf(env))`.

```
UATs generated for story-aacb7060 (plan item 10 of 17)

Story: story-aacb7060 (STORY-143)
Test file(s) created:
  - tests/reconciliation-site-asset-promotion.workers.test.ts

Tests written: 5
Tests passed: 0
Tests failed: 5 (suite failed at import; 0 tests collected)
```

```
⚠️ TESTS FAILING — not a test defect; the subject code is absent from this branch

Failures (all five, one cause):
  - test_UAT_AC1709_a_file_handed_over_for_a_selected_site_is_in_its_asset_library_as_a_public_side_copy
  - test_UAT_AC1710_material_whose_record_forbids_republishing_is_refused_by_every_route
  - test_UAT_AC1711_a_taken_name_yields_a_free_one_keeping_the_extension_and_the_live_asset_is_untouched
  - test_UAT_AC1712_a_failed_placement_is_named_on_a_successful_hand_over_and_carries_no_secret
  - test_UAT_AC1713_material_with_no_file_behind_it_is_refused_and_no_asset_appears

    Error: Cannot find module '../apps/control-app/src/material'

test_files_created:
  - "tests/reconciliation-site-asset-promotion.workers.test.ts"
```

**The fix loop cannot close this by rewriting the tests.** It needs either the REQ-163/REQ-161 commits replayed onto `reconcile-BUNDLE-26`, or the branch re-cut from a tip that has them — plus a migration carrying `ticket_changes` before any of these suites can execute. `git status` is clean apart from the one new untracked test file; no runtime code and no existing test was touched.
