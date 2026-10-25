---
uid: bug-202fd9a5
id: BUG-243
type: bug
title: 'Builders: keep calling ReportResult after reporting until they run out of
  context'
created_by: EPIC-20
created_at: '2026-10-21T13:24:40.462540+00:00'
updated_at: '2026-10-21T15:05:04.016240+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  story_points: 2
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0cb4214e
  commits:
  - working_sha: e8b135941efbe8b542bdc2f17d506e91f8386139
    reconcile_sha: null
    main_sha: null
  - working_sha: 64b4e751ca55b6393d9fc4a924bce35220428ed6
    reconcile_sha: null
    main_sha: null
  version: 0.2.568
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

## What landed

**The host ends the turn itself; no fallback wording was needed.** `guardTurn` (`tools/generate/src/cli/ai/budget-core.ts`) takes a new `finish` predicate: a `tool_activity` event that finishes the turn. The builder's guard is given `finish: reportRecorded` (`account-core.ts`): the event is a `ReportResult` call whose output is a recorded receipt, not a refusal (the same `reportRefused` test the BUG-212 shape hint uses).

When `finish` fires the guard:

- marks the segment finished, so **the report-reserve notice is never attached again** on that segment, whatever its occupancy;
- **closes the turn there**: it yields a `done` event that is *not* `interrupted` (the turn finished, so the manager closes it `complete`, not `aborted`, and REQ-409 does not replace the builder), carrying the turn's usage and last occupancy like the budget stop's `done` does, then returns the inner tool loop. **No further model request is built.** Any tool calls the model put *after* the report in the same reply are not run.
- **A refused report does not finish the turn.** The builder gets its retry, still told to report while past the reserve; the recorded retry ends the turn.

The consultant still receives the report exactly as before: outcome `reported`, the builder's summary, `changed` and checks unchanged.

Cause 2 (the receipt not saying the work is over) was driving the loop below the reserve too; ending the turn host-side covers both causes, so the receipt text is unchanged.

**Framework:** no upstream ticket filed. The guard already owns ending a builder's turn between requests (REQ-296, BUG-212), so this is the same seam, not a workaround. A framework `report` that ended the worker's turn itself would be tidier, but it isn't needed.

## Tests

- New: `tests/test_UAT_FC_BUG-243_recorded_report_ends_builder_turn.workers.test.ts`, which drives the real route with a scripted builder model that would keep reporting if asked:
  - past the reserve, reports once: exactly 3 builder requests, the notice only on the one before the report, outcome `reported`;
  - below the reserve, reports: the turn ends after the report, no notice;
  - a refused report past the reserve is followed by a retry that still carries the notice; the recorded retry ends the turn;
  - the consultant receives the report unchanged (summary, `changed`, passed/failed checks).
- Adjusted, because their scripted builders depended on a request *after* the report: REQ-339 `no_later_turn_of_the_worker_recovers_it_either` (a read before the report gives the worker its second request), REQ-411 `a_non_concurrent_tool_in_the_same_reply_still_runs_alone` (builder scripts are `[REPORT]`), REQ-421 `builder_system_asks_an_hour...` (the builder reads, then reports).
- Regression scope: the 33 suites that drive builders, the report or the guard. The only failures are 13 that also fail with the fix removed (reconciliation-assistant-conversation AC1051–1061, REQ-341 config, REQ-295 ×2).