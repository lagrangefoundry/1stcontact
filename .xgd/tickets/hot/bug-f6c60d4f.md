---
uid: bug-f6c60d4f
id: BUG-322
type: bug
title: 'Progress: no stage in progress after First draft ticks itself done, and Carry
  on counts as reviewing the draft'
created_by: EPIC-19
created_at: '2026-10-31T21:21:12.189989+00:00'
updated_at: '2026-10-31T22:31:04.764940+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-e8f81bfc
  commits:
  - working_sha: 9d9854cd6b170dd5a3b203514eaf85b76a3f8b9d
    reconcile_sha: null
    main_sha: null
  - working_sha: 3d358e75194979850db34acbda76e8383b08620a
    reconcile_sha: null
    main_sha: null
  version: 0.2.716
  story_points: 5
---

## Symptom

Production, 2026-10-31, Ariel's Arc Welding (`plan-ef108d8d`, site `site_be615746320df3268946af454ff075e2`). Progress shows Getting to know you, Looking at other sites and First draft done, and **no stage in progress**, while the Site consultant is actively revising the site (`milestones.revision_rounds: 2`). Refining (`refining`) stays `not_started`; its stage guide was never delivered.

Stage records:
- `first_draft`: `done`, settled 2026-10-31T20:24:10.262Z, "the client has seen the first draft and responded to it".
- `refining` … `ready_to_publish`: `not_started`.
- Milestones: `first_pass_at` 20:16:46.772Z, `draft_seen_at` 20:24:10.262Z, `feedback_at` (first stamp) 20:24:10.262Z.

## Root cause

1. **Nothing starts the next stage after a self-ticking stage completes.** `settleStages` (plan-core.ts, REQ-432) ticks Getting to know you, Looking at other sites and First draft done by rule. Starting the next stage is left to the consultant's `set_stage`, but the only line it is told is `stagesSettledSince`'s `"First draft" is done: … It ticked itself; don't tick it.` — nothing tells it to start Refining. The consultant's last `set_stage` was `first_draft` at 20:00:39; it never started `refining`.
2. **Carry on is counted as the client reviewing the draft.** BUG-294's Carry on button sends `CARRY_ON_MESSAGE` ("Please carry on from where you stopped.") through `say()` as an ordinary client message. `clientMessaged` (BUG-269) stamped `draft_seen_at` (preview pane open) and `feedback_at` from that one message, so First draft ticked done at the instant Carry on was pressed — mid-build, with Classes and three other pages still being built, and before the client had said anything about the draft.
3. **The first pass counted as built too early.** `first_pass_at` was stamped at 20:16:46, when the first builder Delegate of the message returned; the same message went on building the remaining pages until it was lost at 20:20:52.

## Fix

1. **When a stage ticks itself done, the host starts the next stage.** The next stage in Progress order that is not done becomes `in_progress`, and its stage guide is delivered to the consultant on its next turn, as `set_stage` would. Not a stage the client chose to skip, and not one that waits on an unfinished earlier stage (REQ-445's `stageWaitsOn` / hold rules unchanged). The line the consultant is told names both: `"First draft" is done … "Refining" has started.` The consultant can still move stages itself with `set_stage`.
2. **Host-sent messages are not client feedback.** Carry on's message, and any other message the panel or host sends on the client's behalf (cues, automatic carry-ons), never stamps `draft_seen_at` or `feedback_at`. Only words the client wrote do. Carry on is marked as such on the wire (or sent as a cue) so `clientMessaged` can tell.
3. **The first pass is built when the message that builds it has finished building,** not when its first builder pass returns: `first_pass_at` is stamped once the message's last builder pass of that message is done (or the message ends), so a draft still being built can't be "seen".
4. **Repair Ariel's plan:** once deployed, a site in this state (a self-ticked stage done, the next `not_started`, nothing in progress) has its next stage started by the same rule on the next plan write.

## What changed

1. **The host starts the next stage after a self-ticking stage ticks itself done** (`plan-core.ts` `startNextStage`, run at the end of `settleStages` on every plan write). It applies only while no stage is in progress and the furthest stage touched is a self-ticking stage (Getting to know you, Looking at other sites, First draft) that ticked itself done (`settled.did: 'done'`) and has not yet started one. The next stage in Progress order becomes `in_progress` unless it is not `not_started`, is one the client chose to skip (Looking at other sites with the comparison board skipped, `comps_skipped_at`), or waits on what it requires (REQ-445 `stageWaitsOn`). Only that one stage starts: Colours & fonts, which also requires First draft, stays not started. The start is recorded on the ticked stage as `settled.started: <next id>` with a fresh `settled.at`, and the consultant's next turn is told `"First draft" is done: … It ticked itself; don't tick it. "Refining" has started.` The started stage's guide is handed over by the existing stage-guide rules (REQ-477), as `set_stage` would make it. Once the host has started a stage (the mark is set), the stages are the consultant's again: if it sets the started stage back to not started, it stays there.
2. **Repair (Fix 4)** is the same rule. A stored plan in Ariel's state (First draft ticked done, Refining not started, nothing in progress, no `started` mark) has Refining started, and the line told, on its next plan write.
3. **First-draft guide waits for the site plan** (`stage-guide-core.ts`). Because the host can now start First draft as soon as Looking at other sites ticks done, the first-draft guide is due only once the pages are recorded (`!structureUnwritten`), whether First draft is in progress or nothing is built yet. Otherwise BUG-304's one-guide-at-a-time rule would hand over the first-draft guide and pass over the design and site-plan guides. After the first pass, `structureUnwritten` is false, so a reopened First draft still gets its guide.
4. **Carry on is not the client's words** (`router.ts`). The origin knows BUG-294's Carry on message by the panel's stock text, `CARRY_ON_MESSAGE` ("Please carry on from where you stopped."), kept identical in `router.ts` and `builder/chat.js`. The text itself is the mark on the wire. On `/api/ai/prompt` and `/api/ai/interpose` that message skips `clientWrote` entirely, as a cue already does: no `draft_seen_at`, no `feedback_at`, no focus round ended. Cues and automatic carry-ons (`lost`, `continue`) were already not client words.
5. **The first pass is recorded when the message building it has finished building** (`host-core.ts`). While a consultant message runs (`continuedTurn`), a builder session that would be the first pass (`recordBuild` with no `first_pass_at`), including the REQ-458 site-based and BUG-275 follow-up paths, is held (`firstPassHeld`) rather than written. It is recorded at the message's hand-back with nothing left to build (`ended && !unfinished`, before the review is computed, so REQ-427's first-draft review still falls due and holds the hand-back), or else when the message ends however it ends (`finally`). A first pass held by a message that was never resumed is recorded when the next message starts. Round 0's REQ-458 check still records at once a draft built by earlier messages.

## Supersedes

- REQ-432 `test_UAT_FC_REQ-432_every_note_reacted_the_card_hearted_and_a_headline_chosen_is_done_with_no_set_stage`: the "Getting to know you is done" line now ends `"Looking at other sites" has started.`
- REQ-450 `test_UAT_FC_REQ-450_the_plan_is_ready_for_a_first_draft`: a first-draft test copy keeps Looking at other sites done (ticked itself), so the host now starts First draft. It reads `in_progress`, not `not_started`. Refining and later stages are still not started.

## Test plan

`tests/test_UAT_FC_BUG-322_progress_after_first_draft.workers.test.ts` (over the wire, real router, D1, ticket store, delegation, shipped stage guides):
- `test_UAT_FC_BUG-322_next_stage_starts_when_one_ticks_done`: the client writes with the draft on screen → First draft done, Refining `in_progress`, and that turn carries the "has started" line and `## Stage guide: refinement`.
- `test_UAT_FC_BUG-322_carry_on_is_not_feedback`: with the first pass built and the preview open, the Carry on message leaves `draft_seen_at` / `feedback_at` unset and First draft not done; the client's own message afterwards sets them and ticks it.
- `test_UAT_FC_BUG-322_first_pass_after_last_builder_pass`: one message runs two builder Delegates; `first_pass_at` is unset while the second builder session runs and is stamped after it.

`tests/test_UAT_FC_BUG-322_next_stage_starts.test.ts` (seed, Toolbox, plan operations, client board actions, host milestone entry points):
- `test_UAT_FC_BUG-322_next_stage_starts_when_one_ticks_done`: First draft → Refining (only Refining, not Colours & fonts; refinement guide due) and Getting to know you → Looking at other sites (comparison-board guide due), each with the combined line.
- `test_UAT_FC_BUG-322_skipped_or_held_stage_not_started`: comparison board skipped → Looking at other sites not started; a stage already in progress → nothing started; Refining set back by the consultant after the host started it → stays not started.
- `test_UAT_FC_BUG-322_stranded_plan_repaired_on_next_write`: Ariel's stored state → Refining started on the next plan write, with the line.
- `test_UAT_FC_BUG-322_first_draft_guide_waits_for_the_site_plan`: First draft in progress with design/site plan unwritten → design, then site-plan guide; the first-draft guide only once the pages are recorded.
- `test_UAT_FC_BUG-322_carry_on_text_is_the_same_in_panel_and_origin`: `CARRY_ON_MESSAGE` is identical in `builder/chat.js` and `router.ts`.

Regression scope: every node suite importing plan-core / stage-guide-core / host-core / plan (65 files), and every workers suite touching stages, guides, milestones or Delegate (88 files). Red apart from the two superseded pins, and red on the pre-change source too: REQ-146 error-path scrub, REQ-361 restructured box, REQ-398 progress banner hover, REQ-295 ×2, REQ-416 ×3, REQ-436 ceiling, REQ-458 builder-holding-pages, REQ-466 prompt budget.