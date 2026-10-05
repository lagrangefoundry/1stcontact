---
uid: request-27e96a06
id: REQ-390
type: request
title: 'Plan panel: a stage tracker the consultant ticks off, a live working line,
  and multi-line answers'
created_by: EPIC-19
created_at: '2026-10-04T23:28:43.974557+00:00'
updated_at: '2026-10-05T01:36:07.073069+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-3e2e914e
---


## What changes

The top of the plan panel shows **where the build is**, as a short list of stages the consultant ticks off. While the consultant is working, the client sees **movement and how long it's been going**. The panel also gains a **multi-line answer** type.

## Why

From the Charlie's Plumbing 3 debrief (EPIC-19, 2026-10-04): the only sign the consultant was busy was the red stop button, and the client had no sense of overall progress. Finding 18 also showed the plan's single `phase` field never moved on its own (it stayed at `intake` throughout Charlie 2).

## Requirements

### 1. Stages, ticked off by the consultant (operator-approved list)

> Getting to know you → Looking at other sites → First draft → Refining → Colours & fonts → Finishing touches → Ready to publish

- The plan holds each stage with a state: **not started**, **in progress** or **done**. It **replaces** the single `phase` field. The current stage is whichever one is in progress, and existing plans are migrated by mapping their `phase` onto it.
- **The consultant marks stages**, with a plan operation to set a stage's state. It starts a stage when the work on it begins and ticks it when the client agrees it's done.
- **Any order, and backwards.** Stages can be done out of order, skipped, and reopened (a done stage goes back to in progress) without anything looking like an error. The display never implies a strict sequence: done stages are ticked wherever they are, and reopening one simply moves the "in progress" marker.
- REQ-379's stale-phase check applies to stages: when the build has visibly moved on (for example, pages are being built while "Getting to know you" is still the only stage in progress), the consultant's digest says so.

### 2. The tracker at the top of the panel

- It's the first thing on the plan panel, above the progress counter and the questions: a compact row of the seven stages, done ones ticked, the current one emphasised. Keep it to one or two lines at normal panel width so it doesn't push the questions out of sight. **The operator will judge whether it's a good use of the space**, so keep it easy to make more compact, and let it collapse to just the current stage.
- **While the consultant is working**, the current stage shows an animated indicator (a spinner).

### 3. A working line while busy

- Beside the composer, while a turn runs: *"Alice is building your home page · about 5 min · 2:14 so far"*. The "what" and the estimate come from the consultant's note on the current slow operation (REQ-379's `Delegate` note, generalised by REQ-386). The elapsed timer counts up live. Without a note it reads *"Working · 0:42 so far"*. The consultant's display name comes from configuration, not a constant.
- The red stop button stays as the way to stop, no longer the only sign of work.

### 4. Multi-line answers

A new ask input type for long free-text answers (a few sentences or a list), rendered as a growing text area that saves when the client leaves it, like the other typed inputs.

## Test plan

UATs named `test_UAT_FC_<TICKET-ID>_*`:
- The panel renders the seven stages with their states. Setting a stage to done ticks it, reopening it un-ticks it, and stages can be set in any order.
- While a turn is running, the in-progress stage shows the busy indicator and the working line shows the note's text and a timer that advances.
- A plan with a legacy `phase` is migrated onto the stages.
- A multi-line ask renders a text area and saves its value.
## What was built

**Stages replace `phase` in the plan.** `plan-seed.json` holds the seven stages (ids `getting_to_know_you`, `other_sites`, `first_draft`, `refining`, `colours_and_fonts`, `finishing_touches`, `ready_to_publish`, each with its operator-approved label). The plan stores `stages: [{id, state}]` with state `not_started` | `in_progress` | `done`; a new plan starts with "Getting to know you" in progress. `checkPlan` refuses an unknown stage, a stage listed twice, an unknown state, or more than one stage in progress. The `plan` type pack declares `stages` (list) and no longer declares `phase`.

**Migration on read.** A plan stored with `phase` and no `stages` is read as: the stage that phase meant in progress (`intake` → Getting to know you, `first_pass` → First draft, `revision` → Refining, `prelaunch` → Finishing touches), and every stage before it done; `live` is every stage done. The old `phase` field stays on the stored ticket, unused.

**`set_stage(stage, state)` replaces `set_phase`.** It's in the `KeepMilestones` group, so both consultant and coordinator hold it. There's **one in-progress marker**: starting a stage moves the marker off any other, which goes back to `not_started` unless it was ticked, and the write reports `moved_from`. Any order, skipping and reopening are all accepted. An unknown stage is refused and the plan is left unchanged. The tool's stage enum is exactly the seed list.

**Digest.** The per-turn plan entry opens with `Stages — in progress: …; done: …`. The stale check (REQ-379) now works on stages. When a milestone shows the build has moved on (pages built → First draft, revisions started → Refining, Publish opened → Finishing touches) and no stage that far along is in progress or done, it says: *The stages are behind the build: <why>, but "<current>" is still the stage in progress. Tick the stages that are done and start "<expected>" (<id>) with set_stage.* A later stage that was started early counts as caught up. The surface overview and the consultant priming (`plan-panel` entry) both explain the stages.

**Panel projection.** Both `planPanel` (`read_plan`) and `panelView` (`/api/plan`) carry `stages: [{id, label, state}]` in place of `phase`.

**The tracker.** The tracker is now the first thing on the plan panel, directly above the progress count. It's a compact wrapping row of all seven stages: done ones show ✓, the one in progress shows ● and is bold with `aria-current="step"`, and not-started ones show ○. Nothing marks a stage as skipped or out of order. A ▾/▸ toggle collapses it to the current stage alone, and the choice is remembered in localStorage (`plan-stages-collapsed`). While a turn runs, the current stage's mark becomes a CSS spinner (`createPlanPanel().setBusy`, driven by the chat pane's new `onBusy`).

**The working line.** The line sits immediately above the composer (before `.chat-widget-input-bar`) from the first moment of a turn to its end, by any route. It counts up once a second (`m:ss`, or `h:mm:ss` past an hour). With no note it reads `Working · 0:42 so far`. With a note it reads `<content> · <estimate> · <elapsed> so far`. The host supplies the note as a new stream frame, `{kind: 'working', content, meta: {estimate?}}`:
- The cadence wrapper (REQ-379/386) reports each announced slow call through a new `working` hook. Every `Delegate` updates the note (its text, no estimate), as does every slow tool from `slow-tools.json` (its `doing` text plus `about 1 min` / `about 5 min` / `about 30 min`).
- `siteTurn` yields the frame right behind the announcement line, and only for notes made during that turn.
- `content` puts the consultant's display name from `group-chat.json` in front of the text: "<name> is building your home page" when the note starts with an -ing word, "<name>: <note>" otherwise.

The frame never reaches the conversation. The red stop button is unchanged and is still the way to stop. REQ-360's heartbeat line is unchanged.

**Multi-line answers.** There's a new ask input, `long_text`, available in `set_ask`. On the panel it's a textarea that grows with its contents and saves on `change` (when the client leaves it), like other typed inputs. Line breaks in the answer are kept.

## Design decisions made during implementation

- **One in-progress stage, auto-moved.** The requirement says reopening a stage "simply moves the in progress marker", so there's a single marker. The stage it moves off goes back to *not started*: it can't be *done* without the client agreeing. The digest tells the consultant to tick finished stages.
- **Delegate notes carry no separate estimate.** The `Delegate` note is free text that already says roughly how long ("takes about ten minutes"), so the working line shows it as written. Only slow tools have a structured estimate.
- **The display name comes from `group-chat.json` on the host**, which sends the finished words in the frame. The browser has no name constant, and REQ-357's no-literal rule holds.
- **On reattach (page reload mid-turn)**, the working line starts counting from the reattach, not from the turn's original start, and has no note until the next slow call.

## Supersedes

This deliberately replaces the `phase` behaviour pinned by REQ-356, REQ-364 and REQ-379: `set_phase`, `phase` on the plan and its projections, the panel's phase line (`PLAN_PHASE_LABELS`, `.plan-panel__phase`), the digest's `Phase: …` line and the "phase is behind the build … set_phase" sentence. Those suites' assertions were updated to the stage equivalents: `set_stage` offered to both roles, a new plan's first stage in progress, the type pack declaring `stages`, the tracker as the element above the progress count, and the stale-stages sentence.

## UATs

- `tests/test_UAT_FC_REQ-390_stages_in_the_plan.test.ts` (node, through the plan surface). Covers: the operator list in order, first stage in progress; tick, out of order, marker moved with `moved_from`, reopen; unknown stage refused with the plan unchanged; tool enum equals the seed list; digest names the stages and says when they're behind, but not once a stage that far along is touched; a `long_text` ask accepted and a multi-line client answer kept.
- `tests/test_UAT_FC_REQ-390_stages_and_working_on_the_wire.workers.test.ts` (workers, through `/api/ai/prompt` and `/api/plan`). Covers: a `Delegate`, then a slow tool (`capture_site`), each put one `working` frame right behind its announcement, with the configured consultant name, with and without an estimate, and none repeated from an earlier turn; a plan stored with legacy `phase: revision` reaches the panel as stages (Refining in progress, the three before it done).
- `tests/test_UAT_FC_REQ-390_tracker_and_working_line.test.ts` (jsdom, real builder). Covers: the tracker is first, with seven stages ticked wherever done and the current one marked; reopening moves the marker; the collapse toggle is remembered; during a turn the current stage spins and the line above the composer reads `Working · 0:42 so far`, then `<note> · about 5 min · 2:14 so far`, ticking with no new frames; the stop button is still present; afterwards there's no line or spinner and nothing in the conversation; a `long_text` ask renders a textarea that saves its multi-line value on leave.
