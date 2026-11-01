---
uid: comment-98677ee9
id: COMMENT-6135
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T12:09:24.145773+00:00'
updated_at: '2026-11-01T12:09:24.145773+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-58d00715
  kind: note
---

I added one new UAT file covering the six criteria this bundle changed for story-1500b111, and all 6 tests pass. Seven tests in two older Library files now fail, because they still check for the "On this site" badge, the "Used on this site" filter and the *Used on* label that REQ-181 removed.

```
UATs generated for story story-1500b111 (plan item 9 of 10)

Story: story-1500b111
Test file(s) created:
  - tests/reconciliation-library-badges-the-exception.test.ts

Tests written: 6
Tests passed: 6
Tests failed: 0

test_files_created:
  - "tests/reconciliation-library-badges-the-exception.test.ts"
```

| Test | What it checks |
|---|---|
| `test_UAT_AC1715_whole_business_listed_unbadged_and_a_business_switch_leaves_no_previous_row` | Every row is listed and none says "On this site". It uses the real builder's business selector: a switch shows only the new business's rows, and a failed re-read leaves the list empty. |
| `test_UAT_AC1716_role_kind_and_text_narrow_conjunctively_with_no_refetch_and_no_used_here_filter` | The list header has exactly three controls (text, role, kind), with no "used on this site" one. Filters work alone and combined, and narrowing never re-requests the list. |
| `test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on` | Covers an image, its "no longer in storage" fallback, a PDF in the reader above the record, and a font as download only. The record is read-only and labelled *Placed on*, and nothing outside the description can be edited. |
| `test_UAT_AC2018_warning_and_placed_on_row_agree_on_every_row` | *Placed on* lists every site (shown as "salon, annex"). A site asset gets the warning exactly when that row is empty; background material never does. |
| `test_UAT_AC2020_row_is_one_flex_line_icon_title_role_pill_with_the_warning_only_on_the_exception` | Checks the stylesheet rules (one line, 13px title that truncates, icon and pills keep their width). On every row the order is icon, title, then the role pill, and the warning appears only on an unplaced site asset. |
| `test_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning` | The warning appears on exactly the two site assets with no placement: one with an empty list, one with the field missing. It reads "Not on the site", its glyph is hidden from screen readers, it has the full sentence on hover, and it uses the danger colour, not the accent. |

The other 17 criteria on this story weren't changed in this bundle and already have UATs in other files, so I didn't write new ones for them.

**Older tests now failing.** I wasn't allowed to modify existing test files, so the fix-it loop needs to remove or rewrite these:
- `tests/reconciliation-library-placement-and-row.test.ts`: the tests for AC1715, AC1716, AC2018 and AC2019.
- `tests/reconciliation-library-tab.test.ts`: the tests for AC1715, AC1716 and AC1717.

AC-2019 itself was outside this plan item's changes, but its text still says the "On this site" placement badge remains where it applies. Under REQ-181 that is no longer true, so the criterion needs its wording updated as well as its test.
