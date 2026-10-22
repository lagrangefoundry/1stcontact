---
uid: request-5f1e2bc1
id: REQ-428
type: request
title: 'Executive function: due items that hold, one agenda for talker and consultant,
  a gear-change count, and promises on the plan'
created_by: EPIC-19
created_at: '2026-10-22T20:43:16.729230+00:00'
updated_at: '2026-10-22T20:43:16.729230+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-641e761b
---

## Why (operator, 2026-10-22, EPIC-19)

REQ-424 (focus tasks), REQ-425 (positioning, readiness) and REQ-426 (talker
agenda) gave the consultant the facts it needs to lead. Most of them are
advice it can read past; in Ariel's run it did (14 notes, no reactions, kept
asking for more). The help is needed in the middle of a stage, not before it.
Rules apply to checks, not to the path: readiness still sets the pace.

## What changes

1. **Unreacted notes cap.** With more than 8 story notes the client has not
   reacted to (the threshold is configuration), `pin_notes` is refused
   (a named refusal) until a story-board focus task has run over them. The
   refusal says what to do: start the reaction task.
2. **One agenda for every voice.** The consultant's per-turn plan entry
   carries the same "Open decisions, most valuable first" and "Due:" lines
   the talker gets (REQ-426's `talkerAgenda`), from the same code, so the
   worker, the talker and a plain consultant turn never read different
   versions of what is due.
3. **Gear-change count.** The host counts the talker's and consultant's
   consecutive replies that ask the client a question while changing nothing
   on the plan or the site. At 3, the next notes say so: "You have asked 3
   questions without moving anything — draft it with [?] gaps, put the facts
   on the panel as one batch, or propose." The count resets on any plan or
   site write, or a focus task.
4. **Promises are on the plan.** A request the client makes while a build is
   running becomes a "next" task on the plan, recorded by the talker or
   consultant. It shows in "Being built or next", and when the build hands
   back, the hand-back is not done while a "next" task from the build's
   window is neither started nor explained to the client. This backs the
   priming change `a0089791ee` ("the buttons are next") with state.

## Test plan

- With 9 unreacted notes, `pin_notes` is refused naming the reaction task;
  after a story focus task covers them, it succeeds.
- The consultant's plan entry and the talker's notes carry the same
  open-decisions and Due lines for the same plan.
- Three scripted question-only replies put the gear-change line in the next
  notes; a plan write clears it.
- A client message mid-build asking for X adds a "next" task; the worker's
  hand-back with that task untouched is continued with a line naming it.