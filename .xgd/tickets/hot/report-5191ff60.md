---
uid: report-5191ff60
id: REPORT-11440
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T12:58:44.600686+00:00'
updated_at: '2026-11-08T12:58:44.600686+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-44d0a572
  parent_report_uid: report-4c06ab4b
  batch_index: '0'
---

I fixed the failing AC2424 test (tests only) and corrected AC-2424 to match. All 13 tests in `tests/reconciliation-marked-points.test.ts` now pass. Lint didn't run: eslint isn't installed locally and the sandbox blocked downloading it from the npm registry.

**Why it failed:** the test expected the first point placed after a send to be Point A, but the code gave it C. When a new point is placed, `nextPointLabel` skips every letter used by a mark on screen (`points.js:296`), and that includes the greyed sent marks. They stay on screen until the next render (`bind`) clears them and lettering starts again at A. The story says letters are reused only when "not already used by a point on screen", so the code is consistent with the story. The AC's claim was the part that was wrong.

**Test change** (`tests/reconciliation-marked-points.test.ts`, ~line 812): before the next render, the new point is now asserted to be Point C, with `[Point C]` in the draft, and the old `[Point A]` still doesn't expand. After `controller.bind(doc)`, the test asserts that no marks and no live points remain, that the next point is Point A with `[Point A]` in the draft, and that its render number is one higher. The checks for the greyed marks (dimmed, greyscale, controls hidden, drag does nothing) are unchanged.

**AC-2424** (`acceptance_criterion-e751d14d`) now says that greyed marks keep their letters until the next render, and that lettering restarts at A only after it. The story didn't need changing.

```yaml
## Assessment
status: fixed
failures:
  - test: test_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them
    status: fixed
    root_cause: "Test and AC expected lettering to restart at A right after a send; code (nextPointLabel over all on-screen marks) keeps sent greyed marks' letters until the next render (bind)."
    fix: "Test asserts C before re-render and A after bind; AC-2424 body updated to match."
    verification: "npx vitest run tests/reconciliation-marked-points.test.ts — 13 passed"
upstream_changes:
  - acceptance_criterion-e751d14d (AC-2424)
blocked_by: null
```