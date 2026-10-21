---
uid: comment-9657123e
id: COMMENT-5554
type: comment
title: Comment on request REQ-426
created_by: xgd
created_at: '2026-10-21T22:59:00.438663+00:00'
updated_at: '2026-10-21T23:09:58.555749+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-80487775
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ac05e033-f011-4ac6-bc64-9c1d2ab91460",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0e25c1a0-7a12-4525-a7ed-3522f27fc0da-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T22:57:53.981923+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0e25c1a0-7a12-4525-a7ed-3522f27fc0da-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T23:09:57.281202+00:00" -->
#### Claude
I'm reading the talker code (the per-exchange reminder in `roles.ts`, plus its templates in `priming.json`) before I write a scope plan.

I've got the shape. Now I'm reading the plan's decision model, then I'll write the scope into the ticket and cut the branch.

The branch is cut and the worktree is set up. Now I'm writing the code: the agenda function in `plan-core.ts`.

Now the talker's job text and its notes in `roles.ts` and `priming.json`.

The code compiles. Now the UATs: I'm reading the REQ-416 talker test harness so the new test reuses it.

Updating the three existing assertions that pinned the old talker wording, then writing the REQ-426 test file.

The REQ-424 failure is my wording: "move the site forward" is also in the consultant's priming. I'll switch the negative checks to a phrase only the talker gets. Checking the other failure:

That remaining failure looks pre-existing: the priming text it checks for isn't something I touched. Checking:

26 failures in batch one, 1 in batch two. None of those files are about the talker, so I'm taking a baseline of the same files in the main checkout before blaming my diff.

The typecheck is clean. There's no local eslint (npx tried to fetch one), so I skipped lint. Now the version bump and commit:

Committed on the branch. Now merging back: lock, bring xgd-working in, bump the version at the tip, fast-forward.

The fast-forward landed on xgd-working. Running the ticket-overlay check, then moving the ticket to free_coded:

The ticket is at free_coded with both SHAs. Adding a short "landed" note to the body, then cleaning up the branch.

REQ-426 is built, merged into xgd-working (commits `ce84cea32d` and `0f4dc3a544`, version 0.2.579) and parked at `free_coded`. The ticket body is updated to match what landed.

I didn't stop to ask about one dependency, so I made a call: REQ-425 (positioning card and readiness) is still a draft. I built against the plan as it stands today, so the readiness part of item 2 and all of item 7 aren't in this change. The ticket notes that REQ-425 adds those lines to the talker's notes when it lands.

**What changed**
- **The talker's notes are now an agenda.** REQ-416's "Still missing from the story board: …" line is gone, along with the code that worked it out (`missingStoryAreas`). Each exchange the talker is now told:
  - **Open decisions, most valuable first, with what each still needs:** up to five decisions that talk can settle, with the core story first, then the purpose questions. Each says what it needs, e.g. "talking it through" or "their yes on what you proposed". Decisions settled by showing looks are left out.
  - **What's being built or next**, to draft together with the gaps marked [?].
  - **What's due:** what the story board still needs (reactions, a heart, a headline), checks that have fallen due, and notes waiting for a reaction task.
  - **Questions already on the panel**, which it points to and never asks again.
- **The talker's job text is rewritten** around the ticket's rules:
  - Every question says what it's for, and it doesn't ask one it can't place.
  - It drafts with [?] gaps and puts short facts on the panel as one batch.
  - After two or three questions on one topic, it checks whether more is worth it, then changes gear (a focus task, headline options, or proposing the decision).
  - One warm follow-up, then back to the decision.
- **BUG-240's cued opening** now moves the most valuable open decision forward, saying what it's for, instead of asking about their story.

**Tests**
- Two new tests (`tests/test_UAT_FC_REQ-426_talker_as_strategist.workers.test.ts`), both passing:
  - The talker is told the rules and the ranked open decisions, and the old story-areas line is gone.
  - A scripted talker asked for a classes page puts five facts on the panel (none refused, all saved to the plan) and replies with a draft carrying [?] gaps. On its next exchange it's told those five are already asked.
- The REQ-416 and REQ-424 talker tests checked the old wording, so I changed those few checks to the new wording. Those suites, plus BUG-240 and BUG-249, pass with one exception, which predates this change: REQ-416's priming test looks for "While I build, tell me how the salon started." That sentence was split across two lines in the priming file by an earlier prompt commit (ba4773e9dc). My change doesn't touch it.
- In the wider suites, every other failure also fails on clean xgd-working (assistant-conversation, REQ-174, REQ-398) or is the known problem of running builder-origin tests from a worktree.
- Typecheck is clean. There's no local eslint, so lint wasn't run.

The "Working on a page together" section you already added to the priming reaches the talker too, so it gets the draft-with-gaps guidance from both places. Whenever you're happy with the talker's behaviour, the ticket is ready for you to move to `ready_to_reconcile`.

<!-- xgd-chat-end -->