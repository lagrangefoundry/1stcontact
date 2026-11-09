---
uid: comment-3747b487
id: COMMENT-8063
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-09T04:05:39.201706+00:00'
updated_at: '2026-11-09T04:05:39.201706+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f916807a
  kind: note
---

I couldn't fix the review's one remaining gap (G1) in this phase because it needs a change to production code, and code is frozen here. I made no edits to code, stories, ACs or tests. I filed REPORT-11688 (`report-f916807a`) with `progress_made=false` and `needs_more_work=true`, so the workflow sends the gap to the planner for a scoped exception.

**The gap is real.** In `apps/control-app/src/builder/panel.js`, `rec.src` is set only inside `navigate()` (line 175). `show()` (line 236) and `prime()` (line 213) compare the wanted address with that stored value, not with where the frame actually is. So if the operator follows a link in View, flips to Edit and flips back, View is reloaded even though it is already on the right page. That is the BUG-79 symptom.

**Why I held back the AC and test edits:** rewriting AC-2496 and its UAT to require "no navigation" without the code fix would leave the suite red, and the AC would then describe behaviour the code doesn't have. The report lists exactly what should land together once the exception is granted:
- **Code:** in `panel.js`, decide whether a frame is out of date from its live location.
- **AC-2496:** rewrite paragraph 3 and its Verification section.
- **Test:** change the `test_UAT_AC2496_…` assertions in `tests/test_reconciliation_builder_page_carry.test.ts`: no navigation, the same document object, and the carried scroll offset ending at 300.
- **Optional:** add a "follow a link, then flip there and back" case to the AC-2517 test.

There was no FC orphan report for this ticket, so no `test_UAT_FC_*` files needed renaming or deleting. I ran no tests, as instructed. The report was created, but the same call logged a blocked outbound connection to `github.com:22`, probably an automatic push, so the report may not have reached the remote.