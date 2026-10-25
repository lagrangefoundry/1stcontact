---
uid: comment-52904f4f
id: COMMENT-5544
type: comment
title: Comment on bug BUG-245
created_by: xgd
created_at: '2026-10-21T17:29:54.911788+00:00'
updated_at: '2026-10-21T18:00:06.298064+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-fa003acc
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "922afba1-1745-42b1-8051-30cfee8cdfee",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="fb672ce7-f728-43c3-babe-0c285a80e09f-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T17:29:29.141306+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="fb672ce7-f728-43c3-babe-0c285a80e09f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T18:00:05.135801+00:00" -->
#### Claude
Reading the ticket and the builder chat code (chat.js, comparisons, plan panel) to map the design before scoping questions.

Reading the related tickets (BUG-236, BUG-240, BUG-202, REQ-419, DOC-65) to understand the current comp and hold mechanics.

Tracing where the host assembles the per-turn notices (comp adds, notes, "finished commenting") so I know where the new signals plug in.

Still mapping: now locating the framework's webui-chat package to see how worker prose and the status widget behave.

Reading how webui-chat handles the worker's text after a talker forks (REQ-210 5a) — that decides how the "absorb" works on the client.

Reading the origin's `/api/ai/session` and `/api/ai/prompt` routes to see where a "result was absorbed" flag can live and how replay is built.

Checking whether replayed transcript turns carry a turn id (needed to hide an absorbed result after reload).

Looking at the progress frames and the prompt stream to see what turn id the client can key an absorbed result on.

Reading the plan panel's ask rendering (typed answers, Done, drafts) — items 6–8 change it.

Checking the host's continuation-cue mechanism — it may be how a "board complete" turn starts without the client writing.

Branch cut (`free-BUG-245`). Checking the test harness works in the worktree before I start changing code.

Starting implementation with the data model in `plan-core.ts` (per-comp why/note/state, board note, board-complete settlement).

Now editing the PlanComp type and fields.

Now rewriting the comp-notice and comp-action block in plan-core.

Now the origin side: `session-delta.ts` (comp notices and the new "absorbed news" record on the chat ticket).

Now the host: hide absorbed results on replay, and report waiting news on open.

Adding the hidden "board finished" cue (template + transcript hiding), then the route.

Adding the `cue` to `/api/ai/prompt` in the router.

Server side drafted. Type-checking before moving to the browser code.

Now the `/api/ai/absorbed` route, then the browser pieces.

Updating `api.js`: comp actions, the cue stream (quiet on refusal), and the absorbed report.

Rewriting `comparisons.js` as cards with Send/Skip states.

Comparisons rewritten. Now `chat.js`: replacing the BUG-236 hold with "absorb into the next reply".

Wiring news display on paint; then the plan panel (Save states, "N new" badge, working tint).

Applying the plan-panel changes.

Now the stylesheet: cards, states, badge, working tint, news line.

Now the priming text (both role copies). Reading the hand-back paragraph first.

Now the comps section of the priming (both copies).

Code drafted across host, origin and browser. Running the affected existing suites to see what breaks.

Those 10 failures are the old behaviours this ticket reverses (held marker, Done/likes/dislikes, "I've finished commenting"). Reading the REQ-419 suite to update it to the card model.

Updating the REQ-419 suite's card assertions to the new model (note box, Send/Skip, real-site label).

Updating the BUG-236 suite: dropping the superseded marker and comp-Done cases, moving typed answers to Save + state.

Browser suites pass. Now the workers-pool suites (REQ-378 comp board, BUG-236 panel shape) and BUG-202, which need the control-app `generated/` artifacts.

All four pin the reversed behaviour. Reading them — they're the right harness for the new board-finished and comp-announcement UATs.

Rewriting the superseded workers cases: removing the old likes/dislikes, tile and "finish" UATs (their behaviour moves to new BUG-245 UATs).

Now writing the new server-side UAT file. Checking the BUG-236 workers harness for reusable patterns first.

Server UATs pass except one over-strict assertion (the tool's confirmation naturally echoes the comp's url — that's for the consultant, not the chat). Fixing the test.

`comps_note` isn't persisted — the plan's frontmatter key list in `plan.ts` needs it.

Server UATs green (6/6). Now the browser-side UAT file.

All browser suites green (41/41). Now a broad regression run — checking the memory note on running the full suite.

Triage: BUG-202's tile tests are expected (reversed). Checking the others against the main checkout baseline.

Most failures are pre-existing (same in main). The worktree-only ones (workspace-origin, req115, copy-edit AC1038, BUG-58) look like serving/location artifacts — checking their messages.

Those are the known worktree serving artifacts (503 on webui assets), unrelated. Running the second node batch.

The three remaining are pre-existing on the main checkout too. Now BUG-202's node suite, which pins the reversed tiles.

The priming test was already failing on main (the line break falls inside "In / the same turn"). Since I'm already updating that test, I'll make the regex whitespace-tolerant.

Node side is clean. Now the workers batch (90 files touching host/plan/priming routes).

All 7 are pre-existing on main. Checking for generic scans of the builder directory that my file selection might have missed.

REQ-146 (router error scrubbing) could be mine — checking baseline.

Everything remaining fails identically on main. Code and tests are done; now the commit/merge steps. Checking my notes on the free_coded gate.

Committing on the branch. Checking the repo's commit convention for attribution first.

Committed (`da70b3e`). Now updating the ticket body with an "As built" section (keeping the original text), then merging back.

Ticket updated. Now lock and merge the branch back into xgd-working.

Clean merge. Checking whether anything else landed on xgd-working since the cut that touches the same files (semantic conflicts).

No concurrent code changes. Promoting to `free_coded` (letting the gate do the version bump).

Status is `free_coded` at version 0.2.570. Cleaning up the branch and worktree.

BUG-245 is built and landed on xgd-working. The ticket is at `free_coded` (commit `da70b3e` plus the gate's version-bump commit, v0.2.570), with an "As built" section added under your original text. I didn't need to ask anything first; the design decisions I made are below and in the ticket. Nothing is deployed, and promoting to `ready_to_reconcile` is your call.

**What the client sees now**
- **One voice:** if the work finishes while the client has unsent text in the box, or while a talker reply is being written, the result is never shown as a message. It is withheld for the rest of that round, and a quiet "Done ✓ — the consultant will tell you in its next reply" line appears under the progress banner. The consultant's next turn gets the withheld text with an instruction to answer the client first, then give the news in a line or two.
  - After a reload the client sees exactly what they saw before, and the quiet line comes back if the news hasn't been told yet. This didn't need a framework change: the stored transcript turns carry a turn id, so the origin cuts the withheld text out when it replays.
  - The "The consultant has finished — show what it said" marker is removed.
- **Comps:** adding a site now tells the consultant to say one line for the whole board, ending with an "[Open the board to see]" link that opens Comparisons. There are no images, site links or per-site descriptions in the chat any more.
- **Comp cards:** each card shows the consultant's "Why I picked it" line and a notes box that grows as they type. The footer has **Send to the consultant ➤** and **Skip/Reopen**, and the state is always shown: "Not sent yet" with a dot, "Sent ✓ <time>", or "Skipped". Typing is saved as a draft; editing a sent note makes it "Not sent yet" again. Cards sit two per row on a wide panel, one otherwise, and the board has a header note from the consultant.
- **Send** posts "On <site>: <note>" as the client's own message. The priming caps the consultant's reply at two or three sentences.
- **Board finished:** when every card is sent or skipped, the consultant is told and sums up into `visual_concept` without being asked. If the last action was a Skip, nothing else would start a turn, so a hidden-cue turn starts instead; it runs at most once. "I've finished commenting" is gone.
- **Panel:**
  - Typed answers have **Save** with "Not saved yet" / "Saved ✓".
  - New questions get an "N new" badge and a highlight until the client clicks into them.
  - While the consultant works, the panel has an in-progress-blue edge and a pulsing banner (still under reduced motion), plus a screen-reader line.

**Decisions for you to judge in the next run**
- The choice to withhold is made when the result arrives. If the client then clears the box without sending, the news still waits for their next message rather than appearing.
- Comp notes are one free-text note per card. The consultant still records likes and dislikes with `note_comp`, but the client no longer edits likes/dislikes directly.
- The blue is `#2563eb`, the banner's in-progress colour.

**Tests**
- Two new UAT files, `test_UAT_FC_BUG-245_one_voice_one_thing.test.ts` (browser) and `.workers.test.ts` (real routes), all 20 pass.
- This ticket deliberately reverses BUG-236's held marker and comp Done/finish, BUG-202's in-chat tiles, and REQ-378's client likes/dislikes route. I removed or rewrote those UATs and listed each one in the ticket as superseded.
- I also fixed one BUG-202 priming test that was already failing on main because of a line break inside the phrase it searches for.
- I ran about 300 related test files. The only failures left also fail on the main checkout, or are the known worktree-only 503s on webui assets. They are REQ-285, REQ-342, REQ-295/341, REQ-416 priming, REQ-208, REQ-259, REQ-398 hover, REQ-146, AC960 and REQ-180.

I didn't update the DOC-65/DOC-64 documents. The exception that a sent comp note does start a turn is written only in the priming for now.

<!-- xgd-chat-end -->