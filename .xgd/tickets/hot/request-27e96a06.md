---
uid: request-27e96a06
id: REQ-390
type: request
title: 'Plan panel: a stage tracker the consultant ticks off, a live working line,
  and multi-line answers'
created_by: EPIC-19
created_at: '2026-10-04T23:28:43.974557+00:00'
updated_at: '2026-10-05T01:23:28.710250+00:00'
completed_at: null
last_field_updated: status
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