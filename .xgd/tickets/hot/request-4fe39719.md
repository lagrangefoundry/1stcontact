---
uid: request-4fe39719
id: REQ-424
type: request
title: 'Guided focus tasks: the consultant leads the client through questions and
  story-board reactions, knows when they''re done, and resumes'
created_by: EPIC-19
created_at: '2026-10-21T19:10:14.162881+00:00'
updated_at: '2026-10-21T19:16:47.396429+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## Why (Ariel's AR Welding run, 2026-10-21; operator)

> I was so busy responding to the talker I have not added any reactions to the
> story board … the consultant needing to walk me carefully through a process. It
> got lost asking me for more and more content but never stopped to ask me to
> react to them. Likewise the questions. The consultant should not just throw out
> questions and tell me to answer them when I feel like it. It should choose a
> point in the dialog and direct me (gently) to answer the questions (without
> asking me what my favorite ice-cream flavor is at the same time). Same story for
> the board. The AI needs to understand that now I have answered the questions,
> reacted to the board, and it should resume conversation. If more questions or
> material are added we can repeat this cycle. The current board is almost
> overwhelming.

Today the panel questions and the story board are "fill in whenever suits you":
the client never gets a moment devoted to them, the consultant keeps adding
material and asking new questions, and nothing tells the consultant when the
client has finished — so the client must pick the ball up again. BUG-245 solved
this for the comparison board only (Send/Skip per card, board tells the
consultant when every card is closed).

## What changes: guided focus tasks

1. **A focus task is a step the consultant leads.** The consultant starts one at a
   point it chooses — typically right after starting a build (the client is
   otherwise waiting) or when enough has accumulated. Kinds: **answer the panel
   questions**, **react to the story board**, **comment on the comparisons**
   (BUG-245's board becomes one kind of focus task).
2. **One thing at a time.** Starting a task, the consultant says in one line what
   to do and where, with a `show_client` link ("While I build, have a look at the
   story board and heart the notes that sound most like you — [open the story
   board]"), and **asks nothing else** in that message. While a task is open, the
   consultant (and talker) doesn't open new topics or add new questions/notes to
   that surface; it answers the client if they speak.
3. **The surface shows the task.** The panel or board is highlighted as the
   current task, with progress ("4 of 9 notes reacted to", "2 of 5 questions
   left") and a **Done** for the whole task; skipping individual items stays
   possible.
4. **The host knows when it's done** — every item answered/skipped or reacted, or
   the client presses Done — and tells the consultant, which **resumes the
   conversation without being asked**: briefly acknowledges what it learned
   ("You hearted the shipyard and your dad's rule — those lead the home page"),
   then carries on. This uses the same completion path as BUG-245.
5. **Repeatable.** When new questions or notes accumulate, the consultant starts
   another focus task later, covering only the new items.
6. **Keep each task small.** A reaction task covers at most a handful of notes
   (configurable, default ~8); the consultant keeps the board tidy — merges
   near-duplicates, keeps each theme to its strongest notes — so the board doesn't
   overwhelm. New notes for later tasks are marked "new".
7. **Priming** describes the cycle: gather → focus task → resume; don't stack
   questions on top of an open task; don't leave panel questions or board
   reactions as "whenever suits you".
8. BUG-246's view reporting tells the consultant whether the client has the task's
   surface open.

## Test plan
- Starting a focus task highlights the surface with progress and Done; the
  consultant's message carries the link and no other question (priming).
- While a task is open, a consultant/talker turn adds no new asks or notes to
  that surface.
- Completing every item, or pressing Done, sends the consultant a completion
  notice and starts its resuming turn; the acknowledgement names what the client
  did.
- A reaction task with more than the configured number of notes covers only the
  first batch; later notes are marked new for the next task.


## Correction: the board was never open (operator, 2026-10-21)

> I wasn't even thinking about reacting because I didn't have it open — again I need to be guided to it.

The failure isn't only pace; the client never saw the board. So:
- **Starting a focus task brings its surface in front of the client** — the host switches the view to it (story board, questions panel, comparison board), unless the client is mid-typing, in which case the message carries the link. This is a deliberate exception to "link, don't switch": starting a task is exactly the moment the client is being asked to go there.
- **The surface opens on the task**: on the story board, the notes awaiting a reaction are highlighted and the reaction controls are visibly what to do ("Heart the ones that are most you").
- **If the client hasn't opened the surface** (BUG-246's view report) by their next message, the consultant re-points once, gently, with the link — then leaves it.
- Test: starting a reaction task switches an idle client's view to Story with pending notes highlighted; a mid-typing client gets the link instead; a client who stays elsewhere is re-pointed once.