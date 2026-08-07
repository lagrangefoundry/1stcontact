---
uid: comment-5c0fe311
id: COMMENT-809
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T21:13:33.852972+00:00'
updated_at: '2026-08-07T21:13:33.852972+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ef8e7559
  kind: note
---

**Result: PASS** — REPORT-1629 (`report-ef8e7559`), level=uat, 0 violations / 1 warning / 0 needs_review.

A fix landed between invocations (commit `787c0f491`), so I re-read state from scratch rather than assuming my prior findings still held. Both violations from REPORT-1627 are genuinely repaired.

**What the fix did.** It added `tests/reconciliation-builder-workspace-mounted.test.ts` on a correct premise: both failing criteria need a mounted workspace *and* a live origin at once, which neither sibling suite can host (chrome is jsdom with no origin; origin is node with no DOM). The new suite starts the real builder origin under jsdom.

- **AC-1029** now has a UAT that asserts against the shipped `mountBuilder` with no test-registered mode: both modes offered, the edit channel distinct in `getSrc()` and the live frame, the displayed address fetched over the origin returning the real edit rendering, and mode/site composition both directions. That is the AC's verification clause for clause, including its demand that the mode be the workspace's own.
- **AC-972** keeps every prior assertion and adds the missing clause — the real toolbar control is *clicked* after `setSite('beta')`, with the app's own `publishSite` aimed at the live origin, then asserts beta reached 2 revisions while alpha stayed at 1. A regression sending `sites[0].slug` would fail it.

**I verified by execution, not by reading the diff.** The mounted suite runs `2 passed`, and a verbose run confirms both tests reach their unconditional halves against the live origin before emitting their `NOT VERIFIED` warnings. Chrome + origin run `11 passed | 9 skipped`; the origin suite is now 10 tests (AC-972 moved, not duplicated). The assertions can't pass vacuously — they compare bodies against files that only exist if `cmdRender` ran. The move also left no residue: `cmdRevisions` is no longer imported by the origin suite, and a pointer comment replaced the moved test rather than a dangling stub. Mapping is now 22 active ACs ↔ 22 distinct AC-traceable UATs, 1:1.

**The one open item** is the carried-forward AC-973 warning: the divider is never actually dragged (`setSplit()` is the model setter; no pointer events in the file) and "renders as a rail" is asserted as `isCollapsed()`. It doesn't gate, and the untested residue is `webui-split`'s own gesture and paint, which the story puts out of scope.

One caveat worth flagging beyond the report: this machine has no `@gendevlabs/webui-*` install, so 9 chrome tests and both mounted-chrome halves skip or short-circuit. The suites report that honestly in stderr, and the story declares it — but "uat passes" here means "passes to the limit this machine can reach."
