---
uid: comment-c8707ef8
id: COMMENT-5568
type: comment
title: Comment on request REQ-434
created_by: xgd
created_at: '2026-10-23T01:58:34.266460+00:00'
updated_at: '2026-10-23T16:22:23.094396+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-debf3ef5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3d1bab79-ed49-4379-912a-2e714cb3b625",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-23T01:58:30Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-23T01:58:30Z" -->
#### You
The consultant is taking me back to the storyboard during refining. The story board is Stories -> Position -> Headline. We got the headline, we are not proposing to change it — so do more stories really make sense? Content on the site does not have to come from the storyboard, does it?

<!-- xgd-chat role="assistant" ts="2026-10-23T01:58:30Z" -->
#### Claude
No. At 01:46 it pinned three of the client's classes-page lines as notes; at 01:52 it answered 'Sure' (to the hero layout) by recording a todo and starting a story round on six new notes. The board is for discovery — position and headline; after that the client's words are content for the page. Proposed: board settled once done (no pins, no rounds, no unreacted pressure), material goes to the page, reopen only deliberately when position/headline would change; REQ-432's 'new notes reopen' rule would recreate the loop; and a yes is acted on.

<!-- xgd-chat role="user" ts="2026-10-23T01:58:30Z" -->
#### You
432 is implemented, let's create a follow on.

<!-- xgd-chat role="assistant" ts="2026-10-23T01:58:30Z" -->
#### Claude
Filed REQ-434 (3 points, after REQ-432): pin_notes and start_focus story refused while Getting to know you is done, REQ-428 pressure off; priming sends client material onto the page; the host no longer reopens that stage on its own, the consultant reopens deliberately and tells the client; a client's agreement never answered with a reaction round.

<!-- xgd-turn id="be85fbd2-647f-4d25-af12-baab9fbbbb10-user" -->

<!-- xgd-chat role="user" ts="2026-10-23T16:08:40.254651+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="be85fbd2-647f-4d25-af12-baab9fbbbb10-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-23T16:22:22.118970+00:00" -->
#### Claude
I'm reading REQ-432's stage-settling code so I can see where pinning, story rounds and the reopen logic live.

Still reading: I've found where pinning, story rounds and the reopen happen. Now I'm checking the agenda and talker reminder lines that push unreacted notes.

Branch `free-REQ-434` is cut. Next I'll check the REQ-432 test that pins reopening, then start the code.

The priming-budget test (BUG-129) already fails on clean xgd-working: 200,450 against a 200,000 cap. So my priming wording needs to come out net-shorter. Now writing the code.

Core guards are in. Now I'm adding the `reason` parameter to `set_stage` and updating the declaration text.

Priming is now 94 characters shorter than baseline (200,262, still 131 over the cap that was already broken). Next: typecheck and the existing REQ-432/428/424 suites.

Now the REQ-434 UAT suite. First I'll look at how the REQ-428 workers suite drives a scripted consultant turn, so I can reuse it.

Updated the two older UATs that pinned "a new note reopens it". Now I'm writing the REQ-434 node suite.

Five pass. Checking the assertions can fail: I'll temporarily remove the "settled" check from the unreacted-notes count and rerun.

Now the workers suite: a scripted consultant turn answering "Sure" on the real routes.

The workers UAT passes. Now a typecheck and a wider sweep of the plan/story/focus/priming suites.

Typecheck is clean. Running the related node and workers suites.

The long filter list hits a known vitest limit; splitting it into batches.

The client's "How you can help" strip still counts every unreacted note, which would keep asking them. I'll add a `story_settled` flag to the plan view and have the strip skip notes when it's set.

All passing and the typecheck is clean. Checking how this project bumps its version before I commit.

Committed on the branch. Now I'm updating the ticket body to match what was built, keeping the existing text.

Ticket updated. Now merging back: lock, bring xgd-working into the branch, bump the version, then fast-forward.

xgd-working moved while I worked (other sessions merging). Merging it in again, then putting the bump at the tip so the fast-forward works.

Fast-forwarded and the ticket overlay check ran clean. Moving the ticket to `free_coded`.

REQ-434 is built and merged into xgd-working. Once "Getting to know you" is done, the story board takes no new notes and no story rounds, and only the consultant can reopen it. The ticket is at `free_coded` (version 0.2.594).

**What changed**
- **No new notes or story rounds.** While the stage is done, `pin_notes` and `start_focus` of kind `story` are refused with a new `STORY_SETTLED` reason, and nothing is written. The reason tells the consultant to put the client's words onto the page they belong to. Other kinds of round still work.
- **Nothing presses the client.** The unreacted-notes limit, the NEW marks, the "new story notes waiting" Due line and the story part of the focus reminder are all off. The client's "How you can help" strip no longer asks them to react to notes. They can still react, edit, add and delete, and none of that reopens the stage.
- **It reopens only on purpose.** A new seed flag, `reopens: on_purpose`, means the host never reopens this stage by itself. The consultant reopens it with `set_stage` plus a new `reason` parameter; without a reason it is refused. The reopen is stamped with the reason, and the consultant is told to tell the client in one line. Notes and rounds then work again, and the stage ticks itself done once its conditions are met again. "Looking at other sites" still reopens when a site is added, as REQ-432 set it.
- **A yes is acted on.** The `start_focus` description and the focus-tasks part of the consultant's instructions now say never to start a round as the answer to the client agreeing, but to start the agreed work instead. The finish-line text for "Getting to know you" now says the board is settled after that.

**Tests**
- There are two new suites:
  - `tests/test_UAT_FC_REQ-434_story_board_settles.test.ts`, which covers the behaviour above.
  - `tests/test_UAT_FC_REQ-434_story_board_settles.workers.test.ts`, which runs a scripted consultant turn answering "Sure" on the real routes. It checks the tool results and the stored plan: both calls are refused, no round opens and nothing is pinned.
- I confirmed the node suite fails when the fix is partly removed.
- As the ticket said, two REQ-432 tests that pinned "a new note reopens it" now expect the board to stay settled. One REQ-408 wording check follows the new finish-line text.
- I ran 36 related node suites and 17 workers suites. Two fail, and both were already failing on xgd-working before this change:
  - **BUG-129 (priming size limit).** It was over the limit before (200,450 against 200,000) and is now 200,262, because my wording changes are 94 characters shorter in total. It needs about 131 more characters trimmed somewhere to pass.
  - **REQ-416.** A known failing priming check.

Promotion to `ready_to_reconcile` is yours to decide.

<!-- xgd-chat-end -->