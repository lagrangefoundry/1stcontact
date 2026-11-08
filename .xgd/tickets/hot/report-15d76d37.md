---
uid: report-15d76d37
id: REPORT-11468
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T14:08:21.598673+00:00'
updated_at: '2026-11-08T14:08:21.598673+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-144
  parent_report_uid: report-7bb22111
  batch_index: '0'
---

The three failing tests now pass. They were stale: they predated REQ-213, which makes an upload's role (*What it is for*) editable, and still asserted the old rule. The production code wasn't changed. All four Library suites pass (16 of 16 tests), including the newer role-correction suite.

| Test | Why it failed | Fix |
|---|---|---|
| `test_UAT_AC1717_…read_only_record_under_placed_on` | It said no row of the record is editable. The test opens `guidelines.pdf`, an upload, so `library.js:560` makes the role row editable. | It now checks that exactly `['role']` is editable in the record, that any editing control sits in the description or the role row, and that `rights` and `republishable` stay read-only. |
| `test_UAT_AC1718_…committed_correction_is_stored` | It said the description was the only editable field on the whole pane. `material-3` is an upload, so the editable fields are `['role', 'body']`. | It now expects `['role', 'body']` across the pane and `['role']` inside the record, then edits the description row by name instead of taking the first editable row. The save check is unchanged. |
| `test_UAT_AC2086_…the_download_is_the_screenshot` | The role field is now marked required (`library.js:181`). The installed `fields` component then labels it `What it is for *`, even on a read-only capture. | It now expects the exact label `What it is for *`. |

Each change keeps the test exact. Any second editable field, or a role control on fetched or captured material, still fails it.

I didn't update any tickets. AC-1717 and AC-1718 already describe the editable role, and AC-2086's own claim (the file count and the screenshot download) didn't change.

```yaml
## Assessment
status: fixed
blocked_by: null
```