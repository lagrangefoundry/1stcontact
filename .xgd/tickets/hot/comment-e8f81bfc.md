---
uid: comment-e8f81bfc
id: COMMENT-5902
type: comment
title: Comment on bug BUG-322
created_by: xgd
created_at: '2026-10-31T21:56:35.080736+00:00'
updated_at: '2026-10-31T22:14:24.997916+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f6c60d4f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "44614db0-ebe7-4ba5-9e91-4a28332310c8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9ef45a4f-b0fd-4d70-a17d-be7e35faf9d3-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T21:55:48.294877+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="9ef45a4f-b0fd-4d70-a17d-be7e35faf9d3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T22:14:24.181933+00:00" -->
#### Claude
Reading the code paths behind BUG-322's four fixes (stage settling, Carry on, first-pass stamping) before I write anything.

Still reading: the stage-guide rules affect how auto-starting First draft would interact with the design guide, so checking that before I code.

Tracing how the panel's `say()` reaches the prompt route, so Carry on can be marked as host-sent on the wire.

Now on Fix 3 — finding where a builder pass's return stamps the first pass, to move that to the end of the message.

Fix 3 touches the message loop, so checking what else reads `first_pass_at` mid-message (REQ-455's first-draft cut) before choosing where to stamp it.

Scope is clear enough to proceed. Setting the ticket to `free_coding` and cutting the branch.

Worktree ready. Implementing Fix 1 (host starts the next stage) in `plan-core.ts`.

Now the first-draft guide rule, so an auto-started First draft can't swallow the design and site-plan guides (BUG-304 hands over only the furthest).

Fix 2: the prompt and interpose routes stop treating the panel's Carry on message as the client's words.

Fix 3: deferring the first-pass stamp until the message's building is done, in `host-core.ts`.

Code for all four fixes is in. Typechecking next.

Typecheck clean. Now the UATs — reading the existing tests I'll model them on.

Writing the plan-level UATs (node) first.

The fixture's "Looking at other sites" reopened itself (its facts don't hold), so the test plan needs a truly finished stage. Fixing the fixture.

Node UATs pass (4/4). Now the over-the-wire workers UATs; checking the scripted client supports async steps.

Importing the browser `chat.js` inside workerd is fragile; moving the "panel and origin agree on the text" check to the node suite as a source comparison.

Two harness problems: the seeded site still has Getting to know you in progress, and builder sessions don't take 3 requests each. Fixing both fixtures.

All 3 workers UATs pass. Checking they actually fail on the old code, by reverting only the source files temporarily.

Discriminating as intended (the skipped/held guard passes on old code by design). Now the regression scope — the stage, guide, first-draft and cadence suites.

Only the expected supersession: REQ-432 pinned the old line without "has started". Updating that assertion.

9 failures across 6 files — baselining those against the old source to separate pre-existing reds from mine.

Eight are pre-existing; one is mine: `REQ-450 the_plan_is_ready_for_a_first_draft`. Looking at it.

Now a broader node sweep over every suite importing plan-core, stage-guide-core or host-core.

All three are pre-existing on the old code too. Regression scope is clean apart from the two pins I deliberately updated. Updating the ticket body before committing.

Ticket body updated (original Symptom/Root cause/Fix kept). Committing on the branch.

Committed `9d9854cd`. Now the merge-back order from my notes: lock, merge xgd-working into the branch, bump there, fast-forward back, gate.

BUG-322 is fixed and merged into xgd-working at version 0.2.716 (commits `9d9854cd` and `3d358e75`). The ticket is at `free_coded`. It isn't deployed yet, so Ariel's plan only gets repaired on its next plan write after a deploy.

**What changed**
1. **The next stage starts on its own.** When Getting to know you, Looking at other sites or First draft ticks itself done and no stage is in progress, the host starts the next stage. The consultant's next turn is told `"First draft" is done: … It ticked itself; don't tick it. "Refining" has started.` and gets Refining's stage guide. The host doesn't start a stage the client skipped (the comparison board) or one still waiting on an earlier stage. It also starts only one: Colours & fonts stays not started. After that the consultant can still move stages with `set_stage`, and the host won't undo it.
2. **Ariel's plan gets repaired by the same rule.** A plan stuck with a stage ticked done and nothing in progress gets its next stage started on its next write.
3. **Carry on isn't counted as the client reviewing the draft.** The server recognises Carry on by its fixed button text. A new test checks the panel and server copies of that text match. That message no longer marks the draft as seen or as feedback, in either `/api/ai/prompt` or `/api/ai/interpose`.
4. **The first pass is recorded later.** It is now stamped when the message's building is done, not when its first builder pass returns. That's either the hand-back with nothing left to build, or the end of the message however it ends. The first-draft review still comes due before the hand-back.

**Choices you may want to check**
- **The text is the marker.** I didn't add a separate flag for Carry on because that would mean threading it through the chat widget's send path. The catch is that a client who types that exact sentence would also not count as feedback.
- **First-draft guide timing.** The host can now start First draft as soon as Looking at other sites ticks done, which can be before the design and site plan exist. If its guide arrived then, the one-guide-at-a-time rule would skip the design and site-plan guides. So the first-draft guide now waits until the pages are recorded.
- **Two existing tests changed on purpose**, and the ticket lists both:
  - REQ-432's "Getting to know you is done" line now ends with `"Looking at other sites" has started.`
  - REQ-450's first-draft test copy now shows First draft `in_progress`. The copy leaves exactly the stuck state this fix repairs, so the host starts it.

**Tests**
- 8 new tests across two files: one over the real router and D1, one at plan level. All pass, and 7 of them fail on the old code. The eighth checks that skipped and held stages aren't started, so it passes either way.
- I ran the related suites: 65 node files and 88 workers files. 12 tests fail, and all 12 fail the same way without my change: REQ-146, REQ-361, REQ-398, REQ-295 ×2, REQ-416 ×3, REQ-436, REQ-458 (builder holding pages) and REQ-466.

<!-- xgd-chat-end -->