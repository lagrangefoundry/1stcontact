---
uid: comment-2c554a37
id: COMMENT-8062
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-09T03:36:47.423470+00:00'
updated_at: '2026-11-09T03:36:47.423470+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6d5e88e9
  kind: note
---

I filed the iteration 6 fix plan as **REPORT-11680 (report-6d5e88e9)**. It contains one batch and has not yet been through the plan validator.

**Why the last plan was rejected:** the validator logged `fix_plan_filter_rejected` in session `ra0c6c405`, seq 500. The batch's `instructions` named `apps/control-app/src/builder/panel.js`, a production file frozen in reconcile mode, and the batch granted no `code_frozen` override. The diagnosis was sound; the path was cited only as evidence. The new plan keeps production paths out of the batch's `instructions` and `ladder` and cites them only in the report body. No production change is needed, so I granted no override.

**The diagnosis is unchanged:** `tests/test_reconciliation_builder_page_carry.test.ts` still assumes one iframe that is re-pointed on each View/Edit switch. Since BUG-79, each mode has its own frame. The test fakes the page only on the frame showing at mount, so after the switch to Edit the workspace reads a blank frame. That is why the AC2496, AC2497 and AC2499 UATs fail, and why their three orphaned-AC entries appear.

I corrected two points from the last plan by reading the reference code at `reconcile-src-BUG-79`:
- **The save in AC2497:** a write loads the newer page into a second frame behind the visible one and swaps it in (`reloadDocument()`, panel.js lines 742–771). The test must drive it with `app.panel.reloadDocument()`, as the passing AC2521 test does, not by firing `load` again on the visible frame.
- **No load on a switch back:** when the target frame already holds the right page, the switch fires no `load`, so the test must check scroll, open panel and selector right after the switch. The first switch in AC2496 (View is on `about`, while Edit was preloaded at the root) does navigate the Edit frame, and AC-2496 allows that.

**What the batch asks the builder to do:**
- Rewrite only the tests, reusing the per-frame setup that already passes in `test_reconciliation_builder_flip_in_place.test.ts`.
- Keep every assertion the acceptance criteria require.
- Also move AC2498 onto the new setup, since it currently passes only because it reads the blank frame.
- Keep AC1029 and AC1036 green, with AC2517–AC2522 run alongside as dependency tests.

**Ladder:** rung 1 decided it. BUG-79 is the latest intent on this behaviour and the acceptance criteria are already written for it, so the tests change, not the code. I changed no acceptance criteria. No builder has raised a block that I would need to rule on.

While filing, the sandbox blocked an outbound connection to `github.com:22`, probably an automatic push by `xgd`. The report was created locally anyway.