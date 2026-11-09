---
uid: comment-ab62bed3
id: COMMENT-8050
type: comment
title: Comment on bug BUG-392
created_by: xgd
created_at: '2026-11-09T00:20:26.300630+00:00'
updated_at: '2026-11-09T00:29:27.723982+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-c54cf144
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d79811dd-2f61-49d7-b2aa-20ce95313bef",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="25661153-b352-4f09-8d01-9c59dcbf0982-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T00:19:38.542411+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="25661153-b352-4f09-8d01-9c59dcbf0982-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T00:29:25.386420+00:00" -->
#### Claude
Not a duplicate — BUG-393 (landed) touches the same reminder but keeps the button → Legal and doesn't address refresh or Country. Starting the free-coding flow: status, branch, then code.

Wiring the country list: checking how the legal overview sends `detailFields` so the server can include country choices, like Shipping's `choices`.

Now editing: paperwork.js (country select, `openDetails` method, save callback).

Server side and Shop next.

Now the UATs. Looking for an existing test that mounts the whole builder with Shop and Paperwork transports.

Baseline suites pass. Writing the BUG-392 UATs now. First checking how the existing suites drive the details form and the legal overview route.

The four new UATs pass. Now checking they fail against the old code.

All four fail on the old code. Next, a short workers UAT checking that the real `/api/paperwork/legal` route sends `countryChoices`.

Fresh worktree lacks the generated artifacts; copying them from the main checkout per the known setup step.

Now the regression scope: the REQ-665/666/669 and BUG-386/388/393 suites, plus typecheck.

Typecheck is clean. One worry: the Legal assistant reads this overview, so I'm checking that the new list of ~240 codes doesn't end up in the model's prompt.

Only selected fields reach the assistant, so nothing changes there. Now the version bump and commit.

First, updating the ticket body so it records the Fix 2b change before I commit.

Committed. Now lock, merge xgd-working into the branch, bump the version, and fast-forward back.

Fast-forward landed and the overlay check found nothing to change. Moving the ticket to free_coded.

The ticket is at free_coded with both commits recorded. Cleaning up the branch.

BUG-392 is fixed and merged into xgd-working. The ticket is at `free_coded` (commits `c1610314bc`, `6e349f0fe6`, version 0.2.838, 3 story points). I implemented two of the three fixes as written and dropped one part of the second, explained below. It isn't a duplicate. BUG-393 changes the same notice, but it doesn't touch the button, the refresh or Country.

**What changed**
1. **"Fill in business details" opens the Business details form.** It switches to Paperwork and opens the form directly. "Open Terms of sale" still opens the Paperwork → Legal list.
2. **The notice clears after a save.** The Shop re-checks what selling still needs whenever its tab is shown and after any save in Paperwork → Legal. If the save leaves some details missing, the notice lists only those.
3. **Country is a drop-down.** It shows country names, saves the ISO code, and has "Choose a country…" first. The server now sends the list with the legal details, using the same country list it validates against, so every choice saves. If a saved code isn't on the list, it still shows when the form reopens.

**Decision for you:** I didn't do the part of Fix 2 that hides the "no Terms of sale yet" sentence once the details are complete. BUG-393 was filed after this ticket and has already landed. It keeps that sentence on purpose, quoting you ("I still want to see the reminder…"), and its test checks for it. It also removes the reason the sentence stuck: the Terms of sale are now written as soon as the details are complete, with no publish needed, so the whole notice clears after the re-check. The ticket body records this. If you still want the sentence hidden, say so and BUG-393's test will need to change to match.

**Tests**
- Five new tests pass. Four drive the whole builder: the button opens the form, a complete save clears the notice, a partial save names only what's missing, and Country is a drop-down that saves `IE` and shows Ireland when reopened. The fifth goes through the real server route and checks the country list. The four builder tests fail on the old code.
- These existing suites pass: REQ-661, REQ-665, REQ-666, REQ-669, BUG-386, BUG-388 and BUG-393 (53 tests in total). The type check is clean for the changed files.

The ticket is ready for you to promote to `ready_to_reconcile` when you want.

<!-- xgd-chat-end -->