---
uid: comment-02c55a1c
id: COMMENT-8136
type: comment
title: Comment on bug BUG-406
created_by: xgd
created_at: '2026-11-09T17:42:52.603017+00:00'
updated_at: '2026-11-09T17:55:09.105749+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-897548f6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a175e7f6-51f7-4404-a3be-4e1ad53e8351",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="fb5d3b25-55b7-43d3-8223-688308d0dc0d-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T17:41:19.172642+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="fb5d3b25-55b7-43d3-8223-688308d0dc0d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T17:55:05.369749+00:00" -->
#### Claude
Not a duplicate (BUG-405 covers a related crop *warning*, not these schema gaps). Exploring the schema and renderer now.

Reading the sizing and slideshow schemas to size the three changes.

Now finding how `sizing` is emitted and what `pushTrack` does.

Mapped all three: link allowlist (`isSafeHref`), sizing → reuse existing per-width track machinery, slideshow → per-slide CSS rule. Checking other places that list the vocabulary.

Not a dupe; plan is clear. Setting status and cutting the branch.

Writing the code now: link allowlist first.

Now the per-width height in the schema.

Now the renderer: height track and per-slide framing.

Writing the UATs, modelled on BUG-401's real-Chromium harness.

All five pass in real Chromium. Checking the capture script parses, then running the adjacent suites.

While that runs, updating the ticket body (preserving existing content).

Most failures are the missing `generated/` dir in a fresh worktree. Copying it and looking at the two real failures.

Fixing a doc-comment format the KB projection needs (plain `BUG-406 —`, as its peers use).

Another rule key lacks a provocation; checking whether that's pre-existing.

Pre-existing failure on clean xgd-working (`declaredDesignToken` has no provocation), not from this change. Re-running the regression batch now that `generated/` is in place.

Baselining the other three failures against the main checkout.

All four are red on clean xgd-working too, so none come from this change. Committing.

Now the merge-back and version gate (using the retry recipe from memory).

Moved to `free_coded`. Final ticket touch-ups, then cleaning up the branch.

BUG-406 is fixed: all three gaps are closed, merged into xgd-working, and the ticket is at `free_coded`. The new tests pass in real Chromium. It isn't a duplicate: BUG-405 deals with the crop *warning*, not these missing fields.

1. **`sms:` links.** Buttons and links now accept a phone number with an optional `?body=`, e.g. `sms:+15551234567?body=Photo%20of%20the%20job`. The body may only hold plain URL characters or `%`-encoded ones. Raw spaces, quotes, `<script>`, other parameters, broken `%` codes and `javascript:` are all refused. The renderer re-checks with the same rule, so a bad value that slipped past the validator still doesn't become a link. Page capture now keeps an `sms:` link too, so it survives a re-capture.
2. **Height by width.** `sizing.height.responsivePx` sets a height at each of the page's widths. With 720 at 1280 and 420 at 375, the box is 720px at 1280, about 551px at 768, and 420px at 375 and 320. It stays in the page flow, so the next section starts below it. It must be used with `mode: "fixed"` and no `px`, and the validator refuses anything else. I didn't add the other option the ticket offered (an aspect ratio per width), to keep one way of doing it.
3. **Framing per slide.** Each slide can take its own `objectPosition`, which applies to its photo and its clip. A slide without one uses the slideshow's.

The builder learns its vocabulary from the schemas, so it gets the new fields without separate edits.

**Tests:**
- Five new tests in `tests/test_UAT_FC_BUG-406_page_vocabulary_gaps.test.ts`, all passing.
- I changed two existing tests: REQ-359's check of the refusal message, which now lists `sms`, and an entry in `reconciliation-l1-reference-coverage` for the new height rule.
- Four tests in the related suites I ran still fail, but they fail the same way on clean xgd-working: AC-2105 (another rule, `declaredDesignToken`, has no test case), AC-1627, and the two REQ-473 priming tests.

Commits are `84d6c84f` (the change) and `ba96546f` (version 0.2.847), with story points set to 5. Promoting to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->