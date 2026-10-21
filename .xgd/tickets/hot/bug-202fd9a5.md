---
uid: bug-202fd9a5
id: BUG-243
type: bug
title: 'Builders: keep calling ReportResult after reporting until they run out of
  context'
created_by: EPIC-20
created_at: '2026-10-21T13:24:40.462540+00:00'
updated_at: '2026-10-21T14:55:09.798096+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  severity: high
  priority: high
  story_points: 2
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0cb4214e
---

## Symptom

A builder that has already reported keeps calling `ReportResult` until it runs out of context. In Bob's Salon 3 (2026-10-20/21) 15 of the 18 builder runs that ended at their context ceiling finished with a block of 7–27 consecutive `ReportResult` calls, each with a slightly different body. 284 redundant calls in all.

Example, `worker-builder-1-64wtkf`: its last real edit was at 19:28:43; it then called `ReportResult` **27 times**, from 19:28:57 to 19:31:42, every one answered `{"checks": 4, "recorded": true}`. `worker-builder-8` and `worker-builder-16` did the same 27 times each.

Cost: roughly $4 of cache reads in that session, each loop request re-reading 100k+ tokens. It also makes the run read as "ran out of context" in every record, which hides the fact that the work was finished and reported.

## Root cause (most likely, confirm while fixing)

Two things combine:

1. **The report-reserve notice keeps firing after the report.** BUG-212 attaches `templates/report-reserve` to every request once the builder passes `REPORT_RESERVE_FRACTION` (0.8) of its ceiling: *"Call ReportResult now — say what you finished and what is left… do not start more work first."* Nothing turns it off once a report has been recorded, so every request after the report tells the builder to report again.
2. **The report's result doesn't say the work is over.** The framework's `report` answers `{recorded: true, checks: N}`. Nothing in it tells the model its turn should now end.

If the investigation shows the loop also happens below the reserve threshold, cause 2 alone is driving it, and the fix below still covers it.

## Fix

- **The reserve notice stops once a report is recorded.** It is shown only while the builder has not yet reported.
- **A recorded report ends the builder's turn.** After `ReportResult` succeeds, the host ends the builder's turn: no further request is sent. A later report in the same run (if one is ever sent) still replaces the earlier one, as the framework already does; this only stops the host asking for more. If ending the turn host-side isn't possible through the existing `guardTurn` / `toolSet` seams, the fallback is that the result the builder sees says plainly *"Your report is recorded. Your work here is finished: end your turn now, with no more tool calls."*, and the ticket records why the turn couldn't be ended directly.
- If the clean fix belongs in lagrange-framework (a `report` that ends the worker's turn), say so in this ticket and file it there; the host-side change ships here regardless.

## Test plan

- `test_UAT_FC_BUG-243_*`, with a scripted builder model:
  - a builder past the reserve threshold that reports once: no further model request is made after the report (count requests);
  - after a recorded report, no later request carries the report-reserve notice;
  - a builder below the threshold that reports: same, its turn ends after the report;
  - the consultant still receives that report, unchanged.
- Measure afterwards from the builders' tool transcripts: no run should end with consecutive `ReportResult` calls.