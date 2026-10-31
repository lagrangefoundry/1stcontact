---
uid: comment-0eeee5b9
id: COMMENT-5790
type: comment
title: Comment on bug BUG-304
created_by: xgd
created_at: '2026-10-27T23:09:02.279977+00:00'
updated_at: '2026-10-27T23:33:47.357274+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-4c4a092b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f02639f5-1068-4c00-803e-6ab1343ac4fd",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-27T23:08:56Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-27T23:08:56Z" -->
#### You
Dina 7 first draft is underway but no discussion of hero motion???

<!-- xgd-chat role="assistant" ts="2026-10-27T23:08:56Z" -->
#### Claude
The first-draft guide arrived mid-turn at 22:42:30 after the consultant had already said it was building; it delegated 46s later with no animation, stretching the client no to sliding carousels. Also three guides were delivered at once at 22:17.

<!-- xgd-chat role="user" ts="2026-10-27T23:08:56Z" -->
#### You
It is also a conversation that I could be having with the talker while the build is underway?

<!-- xgd-chat role="assistant" ts="2026-10-27T23:08:56Z" -->
#### Claude
Yes: build starts without waiting; the effect becomes an agenda item the talker reads; the choice is recorded; a small hero pass adds it before the hand-over.

<!-- xgd-chat role="user" ts="2026-10-27T23:08:56Z" -->
#### You
Yes please. Also the last few drafts have put text over the hero which is fine, but it needs to be managed carefully with signature motion - it could look great - but enough of the photo needs to be exposed.

<!-- xgd-chat role="assistant" ts="2026-10-27T23:08:56Z" -->
#### Claude
Added: the hero pass keeps text and scrim clear of the moving region, no full-photo overlay, local contrast, and acceptance checks at computer and phone widths.

<!-- xgd-turn id="2639084e-bb57-4c7f-a979-88affc404350-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T23:12:20.310043+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2639084e-bb57-4c7f-a979-88affc404350-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T23:33:40.410970+00:00" -->
#### Claude
Reading the REQ-477 stage-guide code and the agenda (REQ-428) to see where the effect item and one-guide rule fit. Continuing.

Still mapping the plan model: decisions, agenda and how the first-draft stage and hand-over are driven. Next I'll set the ticket to free_coding and cut the branch.

Working out how the host knows the first-draft build has started (to time the agenda item), then I'll cut the branch and code.

Design settled; setting the ticket to free_coding and cutting the branch now.

Good, the worktree has node_modules. Running the existing REQ-477 test there as a baseline.

Writing the one-guide-per-delivery rule in `stage-guide-core.ts` first.

Now the plan side: the `signature_effect` decision, recording it in conversation, and the agenda lines. Checking `checkPlan`'s decision rules first.

Typecheck clean. Checking that the talker actually reads `agendaLines` so the effect item reaches it.

Now the UATs. First checking the REQ-477 tests for any that expect several guides in one hand-over.

Updating DOC-75's first-draft guide (doc-only change via the ticket CLI).

DOC-75 updated. Now writing the BUG-304 UAT file in the worktree.

The plan entry correctly records the decline as "Parked"; my assertion was too broad. Narrowing it to the agenda.

All 5 pass. Now the regression scope: tests touching the agenda, `set_decision`, the plan surface and the priming budget.

REQ-428 fails because my hand-over line pushes the plan entry past its length cap. Checking the cap and REQ-361's baseline on xgd-working.

REQ-361 fails on clean xgd-working too, so it's pre-existing. For REQ-428: the plan entry is capped at 2,000 chars and the hand-over lead already fills most of it. Checking what pins that cap.

I won't raise the cap; instead I'll fold a short effect clause into the hand-over lead itself. Measuring how much room the REQ-428 state leaves.

The hand-over state leaves about 160 chars, so the hand-over effect lines must be short; the full offer stays in the during-build line and the guide. Tightening.

Still at the cap: my line now pushes the next "Due:" line out. Measuring the exact headroom.

Even a minimal hand-over state is at the cap, so the hand-over mention has to live inside the lead. Checking which parts of the lead tests pin before touching it.

I'll fold a short effect sentence into the hand-over lead and trim the lead's example list to make room, keeping every phrase the REQ-444/445 tests pin.

All 24 pass. Adding the gating case to my UAT, then rerunning the full node scope and the related workers suites.

Only the pre-existing REQ-361 failure remains. Now the workers suites that read the agenda or plan surface.

The generated files only re-export the shared framework, so copying them from the main checkout is safe. Running the workers suites.

Three time out. Baselining them on clean xgd-working before blaming my change.

Same three fail on clean xgd-working, so they're pre-existing. Final typecheck and lint, then commit.

Committing the code on the branch.

Now updating the ticket body with the settled design, keeping the existing content.

Ticket updated. Now the merge-back: lock, merge xgd-working into the branch, bump, merge back, move to free_coded (retry loop per the known race).

Wrapping up: adding the memory index entry, then the summary.

BUG-304 is built and merged into xgd-working. The ticket is at `free_coded` (commits `c40ecce6`, `fbf40dea`; version 0.2.685; 5 story points), and the branch is cleaned up. The 5 new UATs pass. A few nearby tests fail, but they fail the same way on clean xgd-working (details at the end).

**What changes for the consultant:**
- **While the first draft builds:** once the design and pages are recorded and nothing has been built yet, the agenda carries the effect item until the client answers. It is the same agenda the talker reads. It asks for two or three options suited to the hero photo with a pick, says how to see motion once built ("Open in new tab" / "View on your phone"), and says a no to sliding carousels isn't a no to this.
- **Recording the answer:** the client's choice goes on the plan as the decision `signature_effect`. The consultant records it with the client's own words, as either chosen (with the option) or declined. This is the only decision the consultant can settle; it's handled the way a chosen look already is. Without the client's words it's refused.
- **The hero pass:** with a chosen effect and the draft back, the agenda opens with a small pass on the hero, and the hand-over waits for it. The brief says where the moving part of the photo is and keeps text and any dark tint clear of it, with no dark overlay over the whole photo. It comes with four checks for the builder: the moving part isn't covered at computer width, nor at phone width, nothing darkens the whole photo, and the headline contrast passes at both widths. I confirmed the delegation lets those checks through. The pass counts as done when the consultant marks the `hero_pass` task done.
- **The hand-over:** it names a built effect and how to see it. If the client hasn't answered, it says the effect is still to come and asks once. A decline removes every effect line.
- **One guide at a time:** when several guides are due at once, only the furthest step's is sent, and the others are marked as passed and never sent later. In the Dina 7 22:17 case only the design guide now arrives. Two steps that start one after another in the same turn can still each send their own guide.
- **DOC-75's first-draft guide** is rewritten to say all of this.

**One compromise you should know about.** At the hand-over, the plan entry the consultant reads each turn is almost exactly at its 2,000-character limit. Three existing tests (REQ-428, REQ-444, REQ-445) depend on that state fitting. So the hand-over's effect sentence is part of the hand-over line rather than a line of its own. The "still to come" sentence only appears for drafts built from a written design, which every first build has been since REQ-448. In real plans the longer hand-over line can push lower lines off the end, such as the reminder about notes awaiting a reaction. I kept the limit as it is; raising it is your call.

**Failures that aren't from this change.** I ran 40 nearby test files and 9 workers test files. REQ-361 fails on the same box-alignment difference, and three workers tests time out (REQ-426, REQ-428's talker test, REQ-458's builder-holding test). All four fail the same way on clean xgd-working.

The updated DOC-75 won't reach the dev or live consultant until the knowledge base is next released and deployed.

<!-- xgd-chat-end -->