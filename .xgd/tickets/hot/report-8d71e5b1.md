---
uid: report-8d71e5b1
id: REPORT-11624
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T23:58:27.655632+00:00'
updated_at: '2026-11-08T23:58:27.655632+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-e214a00d
  parent_report_uid: report-7c94bcea
  batch_index: '0'
---

I fixed `test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute` by changing only the test. Both AC2436 tests pass, and the whole of `tests/test_reconciliation_l1_modals.test.ts` passes (17 of 17).

**Why it failed:** the test still checked REQ-212's old rule that the edit render has no covering shell and no dialog stylesheet. REQ-215 replaced that rule, and AC-2436 was already amended to say the edit render always carries the shell, its declared id, `role="dialog"` and the overlay stylesheet. The code does that, so the test was the stale part.

**What I changed:**
- **Removed** the two outdated checks: that no shell is present (`[data-l1-dialog]` is null) and that the edit CSS never mentions `l1-dlg`.
- **Added** checks that the edit render has:
  - the shell `[data-l1-dialog="p"]` with class `l1-dlg`, wrapping the panel;
  - `role="dialog"` on the panel;
  - no open marker on the shell, so the panel stays laid out in flow;
  - the full `L1_DIALOG_CSS` stylesheet.
- **Added** `aria-haspopup` to the list of attributes that must be absent in the edit render, so it matches the AC.

**Still checked as before:** the draft render ships the dialog script and the edit render has none (no `js`, no `<script>`); each action node stays a `<button>` with the same class and styling; and the draft carries the opens/closes targets.

I changed no production code and added no skip markers. The AC and story already describe the amended behaviour, so no ticket update was needed.

```yaml
## Assessment
status: fixed
tests:
  - test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute: pass
upstream_changes: none
```