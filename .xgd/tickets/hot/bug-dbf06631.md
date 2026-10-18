---
uid: bug-dbf06631
id: BUG-218
type: bug
title: Builder worker composes ReportResult as plain text instead of a tool call,
  so its result comes back "silent"
created_by: xgd
created_at: '2026-10-17T23:09:10.418660+00:00'
updated_at: '2026-10-18T00:15:23.844439+00:00'
completed_at: null
last_field_updated: epic_parent
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
  chat_comment: comment-d8a4e2b8
  epic_parent: epic-95bc3b15
  severity: high
---

## What happened
A `builder` delegation that made a series of page edits (41 operations) ended with `ended.reason: "no_report"`, `status: "complete"`, `outcome: "silent"`. All `accept` checks came back `unreported`.

In `activity.last_words`, the worker had written a whole report as literal text in its reply: `<ReportResult>\n<parameter name="summary">…</parameter>\n<parameter name="passed">…`. It never actually called the tool.

`nudge_skipped` did not apply here (the status was complete, not aborted), but no second ask was made either, and none of the report was recovered.

## Expected
- The host notices tool-call markup in the worker's final text and either parses it as the report or asks the worker once more to send it properly.
- The work log describes an "ask once more" path for a worker that ends without reporting. It did not happen in this case.

## Related issue in the same run
The worker was told to identify six uploaded images by looking at them (their written descriptions had failed). It gave several of them the wrong alt text, e.g. it labelled a photo of a woman with brunette waves as "man with long curly hair". So its passed checks would have been wrong anyway. Possibly a separate issue: workers confidently misidentify images when there is no written description to go on.

## Impact
The caller has to rebuild what happened from the account and pay for screenshots, which is the very cost delegation is meant to avoid.