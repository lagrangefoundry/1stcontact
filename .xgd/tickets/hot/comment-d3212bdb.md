---
uid: comment-d3212bdb
id: COMMENT-8061
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T03:28:42.453997+00:00'
updated_at: '2026-11-09T03:28:42.453997+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-19446684
  kind: note
---

I filed the iteration 6 fix plan as **REPORT-11679 (report-19446684)**. It has one batch. The six failures are the three failing UATs and their three orphaned acceptance criteria, which clear once those UATs pass.

**What's wrong:** the test file `tests/test_reconciliation_builder_page_carry.test.ts` still assumes the old setup, where the panel had a single iframe that was re-pointed on every View/Edit switch. Since BUG-79, each mode has its own iframe and `panel.frame` returns whichever one is showing. The test only installs its fake window and document on the frame showing at mount, which is the View frame. After the switch to Edit, the workspace reads the Edit frame instead, which is still a blank page. So:
- AC2496 records no scroll (`[]` instead of `[640]`).
- AC2497 finds no open panel.
- AC2499 sees the panel selector hidden, because the page it read declares no panels.

**Why the tests change, not the code:**
- The acceptance criteria are already written for BUG-79. AC-2496 states "A switch navigates neither channel".
- The code at `reconcile-src-BUG-79` matches them (`panel.js` lines 491–527, 538–543, 604–610).
- BUG-79 is the later intent and replaces the REQ-215 reload-and-restore approach, so the ladder decided at rung 1.
- No acceptance criteria were changed, no override was needed, and the builder raised no `blocked_by` to rule on.

**What the batch tells the builder:**
- Switch the page-carry tests to the per-mode frame harness that already passes in `test_reconciliation_builder_flip_in_place.test.ts`.
- Send each document to the frame that owns its channel, and load the Edit page before the switch, as the code's priming does.
- Model the post-save reload the way the write path now works: the new page loads behind and is swapped in.
- Keep every assertion the acceptance criteria demand.
- Keep AC2498, AC1029 and AC1036 green, with AC2517–AC2522 run alongside as dependency tests.

**Weak-evidence flags in the report:**
- AC2498 passes only because it reads that blank Edit frame.
- AC1029 checks only the frame address, not which frame is showing.
- The two test files each have their own frame-patching code, which can drift apart again.

The earlier fix_plan and assessment reports for this story are from a previous run and cover different criteria (AC960/964/967/975/1400), so this approach hasn't been tried before. During the report command, the sandbox blocked an outbound connection to `github.com:22`. The report was still created.