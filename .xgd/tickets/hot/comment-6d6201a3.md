---
uid: comment-6d6201a3
id: COMMENT-5749
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-10-26T01:43:03.341383+00:00'
updated_at: '2026-10-26T01:43:03.341383+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-58d00715
  kind: note
---

I've added UATs for the five ACs this bundle changed, and all five pass. Three tests in an older file now fail because they still use the retired `site_slug` field.

**Test file created:** `tests/reconciliation-library-placement-and-row.test.ts`

| Test | Result |
|---|---|
| `test_UAT_AC1715_every_placement_is_listed_and_only_material_placed_on_the_open_site_is_badged` | ✓ |
| `test_UAT_AC1716_role_kind_placement_and_text_narrow_conjunctively_over_one_listing` | ✓ |
| `test_UAT_AC2018_badge_used_on_row_and_filter_agree_on_every_row_across_a_site_switch` | ✓ |
| `test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill` | ✓ |
| `test_UAT_AC2020_row_is_a_flex_line_with_a_13px_ellipsing_title_and_rigid_icon_and_pills` | ✓ |

**Why only five of the story's 19 ACs:**
- AC-2018, AC-2019 and AC-2020 are new in this bundle and had no UATs.
- AC-1715 and AC-1716 were reworded around `placed_on`, the recorded placement list.
- The other 14 ACs already have UATs in `tests/reconciliation-library-tab.test.ts`, `reconciliation-library-reader.test.ts`, `reconciliation-library-surface.workers.test.ts` and `reconciliation-material-row-content-type.workers.test.ts`. I didn't add second copies of those.

**Choices inside the new tests:**
- In the AC-2018 test, a material placed nowhere shows the fields component's own "—" placeholder in its "Used on" row. I counted that as empty, since it names no site.
- AC-1715 also checks that a row carrying only the retired `site_slug` field is listed but not badged.
- AC-2019 also checks that a row with no kind gets the fallback icon labelled *file*.

**Old tests that now fail.** I left these alone because this step may only create new test files. All three still build their fixtures with `site_slug`, which BUG-47 replaced with `placed_on`, so the failures are in the tests, not the code:
- `tests/reconciliation-library-tab.test.ts`, `test_UAT_AC1715_…` and `test_UAT_AC1716_…` — the fixture puts site bindings in `site_slug`, which the code no longer reads. The new tests above cover both ACs against `placed_on`.
- `tests/reconciliation-library-tab.test.ts`, `test_UAT_AC1717_detail_shows_the_file_and_offers_no_control_that_asserts_rights` — it expects a record row named `site_slug`, which is now `placed_on`. The downstream fix loop needs to update it; nothing in the new file covers AC-1717.

The two FC test files for BUG-47 and REQ-176 still pass.

**Not run:** eslint, because it isn't installed locally and the sandbox blocked the npm download. I didn't run tsc either.

```
UATs generated for story story-1500b111 (plan item 3 of 9)

Story: story-1500b111
Test file(s) created:
  - tests/reconciliation-library-placement-and-row.test.ts

Tests written: 5
Tests passed: 5
Tests failed: 0

test_files_created:
  - "tests/reconciliation-library-placement-and-row.test.ts"
```
