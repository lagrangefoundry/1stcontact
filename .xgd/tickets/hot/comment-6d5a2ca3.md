---
uid: comment-6d5a2ca3
id: COMMENT-8065
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T04:21:02.413454+00:00'
updated_at: '2026-11-09T04:21:02.413454+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d2b30b1e
  kind: note
---

I filed the fix plan for iteration 1 as **REPORT-11693** (`report-d2b30b1e`). It is now the latest plan for `report-d402710c` and replaces REPORT-11691 and REPORT-11692. I haven't run the validator myself, so whether it passes shows on the next step.

**Why there's work with 0 failing tests:** the reconciliation review sent back a `code_frozen` hand-off about a gap in the bug fix. If the operator follows a link in View, flips to Edit, then flips back, View reloads the page and loses the scroll position. `panel.js` `show()` and `prime()` check whether a frame is out of date by comparing against the address the pane last set, not where the frame actually is. AC-2496 and its UAT had treated that reload as correct.

**Ruling: the code change to `apps/control-app/src/builder/panel.js` is allowed (rung 1 of the ladder).** The BUG-79 ticket says a frame navigates "never for a mode switch", and every flip is in place. That is the latest intent on this surface, and it settles the question. The pinned reference (`reconcile-src-BUG-79`, lines 498 and 522) has the same comparison, so it doesn't point the other way.

**The single batch:**
- **Code:** on each frame load, record the address the frame is actually at, so a frame already on the operator's page is shown without reloading. Nothing else in `panel.js` changes.
- **AC-2496:** reword it so a frame is only re-pointed when it holds a different page. Its UAT must assert no navigation and no load, the same document, and a scroll offset of 300.
- **AC-2517:** its UAT gets the follow-a-link-then-flip-back case, since its current scenario can't catch this.
- **Kept green:** the tests of every other consumer of `panel.js` (AC-968, AC-1249, AC-2497, AC-2498 and AC-2518 to AC-2522). The REQ-215 and BUG-79 FC test files have to be run by path, because the scoped filter misses names with hyphens.

**One risk:** this is the third plan filed for iteration 1. If the validator refuses this one, it fixes the plan up itself and drops the override, and the batch then can't fix `panel.js`.

The push to `github.com:22` was blocked by the sandbox again, so the report is only in the local ticket store.