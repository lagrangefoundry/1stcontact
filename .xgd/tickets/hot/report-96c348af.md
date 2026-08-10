---
uid: report-96c348af
id: REPORT-1780
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-10T09:29:23.758331+00:00'
updated_at: '2026-08-10T09:29:23.758331+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-189fc1ac
---

All 12 UATs written and passing; the only working-tree change is the new test file (no runtime code, no existing tests touched).

**What I grounded them in:** the surface declaration (`tools/generate/src/cli/ai/l1-surface.json`), its implementation (`ai/toolbox.ts` — `pageSegments`/`labelOf`), the single write path (`cli/edit.ts` — `editL1Get`/`editL1Set`), and the operator's `/api/copy` transport driven through a real `startBuilder`.

**Notes on how the ACs were verified, rather than restated:**
- AC-1083 compares the map against a walk of the *stored* definition written in the test (page tree **and** each component instance's slots), so it can't pass by agreeing with the mapper about which elements are interesting.
- AC-1084 checks each label against its kind's rule (control labels are read off the stored instance), asserts no axis name from the seed appears anywhere in the map answer, and compares the map for the same tree styled and unstyled — byte-identical.
- AC-1088 exercises map → read → replace, then renders and asserts real anchors. I mutation-checked this one (`href="about"` → a wrong value) to confirm the render assertion actually bites.
- AC-1085: the reply's `target` serialises an unscoped `module` as the string `"undefined"` rather than omitting the key, so the unscoped read is asserted positively (attributed to no component on the page) plus a scoped read that names its instance and slot. That is a cosmetic serialisation artifact, not an AC divergence.
- AC-1090 asserts the recovery strategy only (nothing written / don't resend unchanged / read it back), matching the known limit the AC records — it does not assert a field name.

```
UATs generated for story story-189fc1ac (plan item 7 of 8)

Story: story-189fc1ac
Test file(s) created:
  - tests/reconciliation-page-composition-surface.test.ts

Tests written: 12
Tests passed: 12
Tests failed: 0

test_files_created:
  - "tests/reconciliation-page-composition-surface.test.ts"
```

Adjacent regression scope (`reconciliation-assistant-control-surface`, `test_UAT_FC_REQ-129_l1_authoring`, `test_UAT_FC_REQ-130_beyond_l1` plus the new file): 54 passed, 0 failed.
