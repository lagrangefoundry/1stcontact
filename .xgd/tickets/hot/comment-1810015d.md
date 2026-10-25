---
uid: comment-1810015d
id: COMMENT-5638
type: comment
title: Comment on bug BUG-279
created_by: xgd
created_at: '2026-10-25T20:13:20.536571+00:00'
updated_at: '2026-10-25T20:59:20.915132+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-ef101beb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "4d91d725-8234-421e-a368-dc743a1c63c1",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="582dd754-400b-42b9-9ef5-c371c0956ed6-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T20:12:13.894723+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="582dd754-400b-42b9-9ef5-c371c0956ed6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T20:59:17.703844+00:00" -->
#### Claude
Branch cut. Reading the existing gate code (REQ-458 already refuses `show_client`; the incident came through reply text with an inline `#show=draft` link).

Item 1's tool refusal already exists (REQ-458); the gap is reply *text*. Now finding how reply text streams and how REQ-431 handles inline `#show=` links.

Starting edits: cold read kept on the run first, then the announcement hold.

Now writing the hold wrapper in `cadence-core.ts`.

Now wiring it into the host.

Typecheck clean. Now the Debug tab's reviews read.

Now the UAT. Checking the scripted-client helpers and how the response stream reads.

Writing the UAT file.

Both pass. Checking the first test actually fails without the hold:

My falsifier only disabled one half of the check (the regex still matched). Redoing it properly:

Falsifier fails as expected; code restored. Running the regression scope.

The filter ran the whole suite; many failures. Isolating the relevant ones to see whether they're mine:

Baselining those two against the unmodified code:

Both pre-existing. Comparing the full workers-suite failure set with and without my change:

Only REQ-436 differs (BUG-275 flipped the other way — timing-sensitive). Checking REQ-436 in isolation:

Now the jsdom/node suites touching the Debug pane and the REQ-445 test:

The restore used the earlier patch, so my narrowing edit was lost. Re-applying it:

Rerunning the named regression scope against the final code:

Remaining failures are pre-existing (REQ-431, REQ-458 baselined) or timing-flaky (BUG-275, which also failed on the baseline run). Checking my promotion notes before committing.

Linting the changed files, then updating the ticket body before committing.

No ESLint in this project; re-running the typecheck on the final code instead.

Updating the ticket body (keeping the Symptom section as written):

Adding a small jsdom UAT for the Debug pane's new section, following REQ-448's pattern:

Passes. Adding it to the ticket's test plan, then committing.

Committed. Now the merge-back tail per the recorded recipe.

Done. One process lesson worth keeping; adding it to the existing patch-swap memory.

BUG-279 is done and merged into xgd-working. The ticket is at `free_coded` with commits `ae346ec4…` (the fix) and `0609c8d6…` (version 0.2.645), and the ticket body describes what was actually built.

**1. The draft can't be announced in text before its review.** The tool side was already covered by REQ-458: `show_client` of the draft is refused and the hand-over steering is swapped for "review it first". The gap was text. In the Dina's Diner 2 incident the consultant wrote the announcement and its link straight into its reply. Now, while the first draft's review is owed:
- The consultant's reply reaches the client a paragraph at a time.
- Any paragraph that hands the draft over is held back: one that links the whole draft, or says the draft or site is "ready" or "finished".
- The held paragraph is said at the end of the round in which the review has run and every finding is answered. If that round already announced the draft itself, the held copy is dropped, so the client never hears it twice.
- The hold sits underneath the session manager (`holdDraftAnnouncement` in `cadence-core.ts`), so the saved conversation doesn't contain the held paragraph either. A page reload can't show it early.

**2. The cold read is kept.** It's stored on each review as `critique.runs[].cold_read`, and `read_plan` returns it. Its cost was already counted as part of the review (REQ-438). There's a new read, `GET /api/reviews?site=`, and the Debug tab has a "This site's reviews" section. It lists each review newest first, with its verdict, its cold read and its findings with their answers.

**One decision I made:** at first, any link into the draft counted as an announcement. That broke REQ-436, whose "The Prices page is done: [have a look](#show=draft&page=prices)" line after a build was being held. A link to one page is progress, not the hand-over, so only a link to the whole draft (or the "ready/finished" wording) is held now.

**Tests:**
- Two new UATs: a `.workers` test for the held announcement and for storing and serving the cold read, and a jsdom test for the Debug section. I checked the hold test fails with the hold switched off.
- The show-refusal case and the metering case in the ticket's test plan are already covered by REQ-458's and REQ-438's UATs, so I didn't repeat them.
- I ran the whole workers suite with and without the change. The only new failure was REQ-436, and it passes after the change above.
- Still failing, but they fail the same way without my change: REQ-431 `a_reply_that_links_the_view_inline…`, REQ-458 `with_a_builder_holding_the_pages…` and BUG-49 (unrelated). BUG-275 failed once without the change and once with it; it passes when run on its own.

**Worth checking:** a held announcement waits for as long as the review is owed, even into the client's next message. So if the review only clears later, the original "your first draft is ready" can come out at a later point in the conversation.

<!-- xgd-chat-end -->