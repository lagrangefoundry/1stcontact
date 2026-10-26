---
uid: comment-d97b9cf1
id: COMMENT-5748
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-10-26T01:29:59.707152+00:00'
updated_at: '2026-10-26T01:29:59.707152+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-895be99c
  kind: note
---

UATs generated for story story-aacb7060 (plan item 2 of 9)

Story: story-aacb7060
Test file(s) created:
  - `tests/reconciliation-site-asset-placement.workers.test.ts`

Tests written: 3
Tests passed: 3
Tests failed: 0

| AC | Test | Covers |
|---|---|---|
| AC-2015 | `test_UAT_AC2015_a_landed_promotion_records_exactly_its_site_once_and_every_site_it_is_on` | A landed hand-over sets `placed_on` to exactly that site. Promoting onto the same site again still lists it once (the second asset lands as `wordmark-2.png`). A second site lists both. A material never promoted shows `placed_on: []`, an empty list rather than a missing field. |
| AC-2016 | `test_UAT_AC2016_background_hand_overs_soft_failures_and_fetches_record_no_placement_and_keep_the_material` | Three hand-overs, all checked through the route and the listing. A background file sent with the open site places nothing and records nothing. A soft failure (a site that doesn't exist) still succeeds and reports the failure, with an empty `placed_on`. A fetch with a site attached anyway records no placement and no `site_slug`. Every one of these materials can still be listed and retrieved. |
| AC-2017 | `test_UAT_AC2017_a_landed_promotion_makes_one_asset_journal_entry_and_one_that_does_not_land_makes_none` | A landed promotion adds exactly one `asset.add` journal entry, named under the reported name. A renamed asset is journalled under the name it landed as (`kitchen-2.png`). A rights refusal and a refused write each add no entry. |

The other five ACs in this story (AC-1709 to AC-1713) already have one UAT each in `tests/reconciliation-site-asset-promotion.workers.test.ts`. I ran that file alongside the new one under `vitest.workers.config.mts` and all 8 tests passed (2 files, 7.4s). I didn't change that file.

The tests use real D1/R2, the `/api/material` and `/api/material/fetch` routes, and `promoteToSiteAsset`. Only external boundaries are stubbed: the fetch seam, the index hook, and one store that refuses its write call, since real R2 can't be made to refuse on demand.

Lint didn't run: `npx eslint` had to download eslint from npm, and the sandbox blocks the registry. No tsconfig covers `tests/`, so nothing type-checked the file either.

test_files_created:
  - "tests/reconciliation-site-asset-placement.workers.test.ts"
