---
uid: request-63c7d191
id: REQ-432
type: request
title: 'Progress stages settle themselves: done when their conditions are met (all
  notes reacted, position hearted, headline chosen; sites sent and the direction hearted),
  reopened by new work'
created_by: EPIC-19
created_at: '2026-10-23T01:06:53.003493+00:00'
updated_at: '2026-10-23T01:57:39.116039+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 8
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-551e0503
  commits:
  - working_sha: 9203d598df5238e6e773c91da337b751e46fc813
    reconcile_sha: null
    main_sha: null
  - working_sha: bea755d5de3720e2a482cf5c7d68450ca9a9d889
    reconcile_sha: null
    main_sha: null
  - working_sha: c73a69ca420d7465cf142bc74d4923b1d822cda9
    reconcile_sha: null
    main_sha: null
  version: 0.2.590
---

## Why

The progress bar's stages are ticked by the consultant by hand (`set_stage`), and
it forgets. On Ariel's plan (2026-10-23):

- "Looking at other sites" still read **In progress** after all five sites had
  been commented on and sent, and the consultant had proposed the visual
  direction (`visual_concept` = `proposed`). It never asked the client to agree.
- "Getting to know you" still read In progress after the first draft was marked
  done.

The client sees "In progress" with nothing telling them what is left.

## What changes

### 1. A stage is done when its conditions are met, and the host decides that

Each stage's "done when" becomes facts in the plan that the host checks on every
plan write, not something the consultant remembers. The conditions live as data
alongside each stage in `plan-seed.json`, so a stage's rule is a seed entry and
not code.

- **Getting to know you** is done when **every note on the story board has a
  reaction** (or is deleted), **the "Your position" card is hearted** (REQ-425),
  and **a headline is chosen**.
- **Looking at other sites** is done when every site on the comparison board is
  commented on or skipped, **and the client has hearted the visual direction**
  (section 2).
- Other stages: where a stage's done-when can be stated as plan facts, it is. A
  stage with no factual rule yet keeps the consultant's `set_stage`, and the
  ticket session lists which ones do.
- A stage whose conditions are met is set to done automatically. The consultant
  is told in one line ("Getting to know you is done: every note reacted to,
  position confirmed, headline chosen") and is not asked to tick it.

### 2. The visual direction is hearted, like the position card

- Once every site is commented on or skipped, the consultant writes the
  direction (the `visual_concept` decision, as now). It appears for the client
  as a card like "Your position", with a ❤️ to agree and an edit to correct it.
  This is the client's "yes, that's the direction".
- Hearting it settles `visual_concept`. Editing it records the client's wording
  as the direction and counts as agreeing.
- It is one of the "How you can help" lines (REQ-431 section 8c): "Agree the
  look we're going for".
- The consultant's instructions say that after the last site it states the
  direction, puts it on the card, and says so in one line, before it moves on to
  anything else.

### 3. New work reopens a stage

- If something new arrives that a done stage depends on, the stage goes back to
  in progress automatically. Examples: new story notes (unreacted), a new headline
  offered, the position card redrawn, or a new site on the comparison board.
- It goes back to done when the conditions are met again. The consultant is told
  when a stage reopens and why.

## Test plan

`tests/test_UAT_FC_REQ-432_stages_settle_themselves.*`, using plan-core through
the real plan write paths:

- Getting to know you: with every note reacted to, the card hearted and a headline
  chosen, the stage reads done with no `set_stage` call. With one note unreacted,
  it reads in progress.
- Looking at other sites: all sites sent or skipped plus the direction hearted
  gives done. All sites sent but the direction only proposed gives in progress.
- Hearting the direction card, and editing it, both settle `visual_concept`.
- Pinning a new note, or adding a site, reopens a done stage, and settling them
  closes it again.
- The consultant's digest carries the "done" and "reopened" lines.
- Re-run the REQ-390/398 stage UATs, the REQ-425 card UATs, and the REQ-401
  comp-board status UATs.

-

-