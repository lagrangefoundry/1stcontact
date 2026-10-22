---
uid: request-5f1e2bc1
id: REQ-428
type: request
title: 'Executive function: due items that hold, one agenda for talker and consultant,
  a gear-change count, and promises on the plan'
created_by: EPIC-19
created_at: '2026-10-22T20:43:16.729230+00:00'
updated_at: '2026-10-22T21:08:18.417878+00:00'
completed_at: null
last_field_updated: body
status: free_coding
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


## Design (free-coding session, 2026-10-22)

**Reuse, not new machinery.** Every part rides code REQ-424/425/426 already built:
`newNotes`/`focusGuard` for the cap, `talkerAgenda` for the agenda, the plan's
`tasks` and `set_task` for promises, REQ-409/415's continuation loop for the
hand-back.

1. **Cap.** The count is REQ-424's "new" notes: pinned by the consultant, no
   reaction, not deleted, covered by no story task. More than
   `plan-seed.json`'s `focus.max_unreacted_notes` (8) → `pin_notes` refused
   `NOTES_UNREACTED`, naming `start_focus` with `kind: story`. Once a story task
   has covered them (it covers at most 8, so 9 leaves 1), pinning works again.
2. **One agenda.** `talkerAgenda` is split so its "Open decisions, most valuable
   first" and "Due:" lines are written by one function (`agendaLines`), and the
   consultant's per-turn plan entry (`planReminder`, read by the worker, the
   talker and a plain consultant turn alike) carries them. A due check becomes
   its own "Due: ask the client "…" (id) — why." line, the line the plan entry
   already had, so talker and consultant now read the same words; the plan entry
   follows it with how to record it (ask_check / record_check_answer). The
   talker's own notes keep only what is the talker's ("Being built or next",
   "Already on the panel"), since the plan entry it also reads now carries the
   rest; no line is said twice.
3. **Gear-change count.** The host keeps one count per site, shared by the
   consultant's and the talker's replies. A reply that ends having asked the
   client something (a "?" outside a "[?]" gap) and called no tool that writes
   the plan or the site adds one. A reply that called any such tool — every
   plan-surface write except `show_client`, every site write (the talker's
   withheld list, which includes Delegate), `start_focus` included — sets it to
   0. A reply that neither asks nor writes leaves it as it is. At 3 or more, the
   plan entry carries "You have asked N questions without moving anything —
   draft it with [?] gaps, put the facts on the panel as one batch, or propose."
   Read from the round's own junction records (its `tool_issue`s and `delta`s),
   so the worker's writes beside a talker never count as the talker's.
4. **Promises.** `set_task` takes `client_asked` (the client's words): the task
   is recorded as a promise (`asked: {quote, at}`), status `todo`, so it shows in
   "Being built or next". It also takes `told_client`: what you told the client
   about when it will happen (`told`). When the consultant's reply on a client
   message ends normally, a promise made since that message began that is still
   `todo` and has no `told` is owed: the host continues the turn (REQ-409's
   continuations and spend ceiling) with a cue naming each one — start it
   (`doing`) or tell the client when and record it with `told_client`. The
   talker's priming says to record a change asked for mid-build with set_task
   and `client_asked`.

## UATs

- `tests/test_UAT_FC_REQ-428_executive_function.test.ts` — plan-core level:
  the cap refusal and its release by a story task; the plan entry and the
  talker's notes carrying the same Open/Due lines; promises recorded and owed.
- `tests/test_UAT_FC_REQ-428_executive_function.workers.test.ts` — the real
  worker: three question-only consultant replies put the gear-change line in the
  next plan entry and a plan write clears it; a talker records a mid-build
  request as a promise and the worker's hand-back is continued with a cue
  naming it.