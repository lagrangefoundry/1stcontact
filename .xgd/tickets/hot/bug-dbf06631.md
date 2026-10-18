---
uid: bug-dbf06631
id: BUG-218
type: bug
title: Builder worker composes ReportResult as plain text instead of a tool call,
  so its result comes back "silent"
created_by: xgd
created_at: '2026-10-17T23:09:10.418660+00:00'
updated_at: '2026-10-18T00:35:52.976430+00:00'
completed_at: null
last_field_updated: body
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



## Notes (EPIC-19, 2026-10-17)

**This is the second sighting, so it is a pattern.** BUG-208 (ready_to_reconcile) recorded worker 13 doing exactly this: it finished without calling `ReportResult`, was nudged once, and answered the nudge with the same pseudo-XML text. BUG-208 only made the outcome legible (`ended: no_report`) and told builders in their priming that text is never delivered. That instruction did not hold here. So likely the nudge did run and got the same text again; check the worker's session record to confirm.

**Two fixes, the first upstream:**
1. **Recover a report written as tool-call markup.** When a worker's final text is a well-formed `<ReportResult>…<parameter name=…>` block, parse it into the report (marked as recovered from text) instead of dropping it. That lives in lagrange-framework's `delegation_toolbox.js` beside the nudge, so it needs a ticket there.
2. **Find why the builder model emits markup instead of a call.** Two sightings on Haiku builders suggest a cause, not chance: the tool missing from the turn's tool list at that point, the turn ending on a budget warning, or the priming's own examples showing the call as text. Fix the cause, not only the symptom.

**The wrong alt text is BUG-214, not this bug.** The worker was asked to name photos by looking because their descriptions had failed, and the descriptions failed because the image describer refuses every image. Fixing BUG-214 removes the situation. Separately, a builder should be told that alt text written from guesswork is worse than none.



## Investigation (2026-10-17)

- **The nudge did run.** `worker-builder-4-1r8vqq`'s session record (`chat-52ceb009`) shows turn 1 ending on a text `<ReportResult>…</invoke>` block after 41 calls, with no budget line and status `complete`. The nudge was delivered at 22:34:42 and the worker answered it with the same markup as text. The result hid this because `last_words` is the last turn that said something and nothing marks that a nudge ran.
- **Third sighting.** `worker-builder-10-m70cj9` (`chat-b0d99959`, 23:12–23:16) did the same on both turns. That is 2 of 11 `claude_builder` (Haiku 4.5) workers in the session; the other 9 called `ReportResult` normally.
- **Ruled out:** the tool missing from the request (it is sent on every request), a budget stop, screenshots in the context (worker 10 took none), and the priming showing the call as text.
- **Cause:** a Haiku failure mode. Once the text pseudo-call is in the history, a nudge that only asks gets imitated.

## Decision

Fix 1 only: force the report tool on the nudge turn (`tool_choice`). Filed as **lagrange-framework BUG-87** (bug-f671b02a). No code lands in 1stcontact for it. We will not recover a report from the text: the dialects are inconsistent, and the recovered verdicts would be unvalidated.