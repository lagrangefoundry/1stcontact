---
uid: request-4fe39719
id: REQ-424
type: request
title: 'Guided focus tasks: the consultant leads the client through questions and
  story-board reactions, knows when they''re done, and resumes'
created_by: EPIC-19
created_at: '2026-10-21T19:10:14.162881+00:00'
updated_at: '2026-10-21T22:10:43.939904+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-62eb8842
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



## Implementation design (REQ-424 session, 2026-10-21)

**One focus task at a time, stored in the plan** (`fields.focus_tasks`, newest last; the
last one is *open* until finished). A task is `{kind, items, intro, started_at,
finished_at?, finished_by?}` with kind `questions` (open asks), `story` (notes awaiting a
reaction) or `comps` (open comparison cards). Self-contained in `focus-core.ts`, like
`story-core.ts`.

- **`start_focus`** (consultant, plan surface): `kind`, `intro` (the one line shown on the
  surface), optional `items`. Default items: every open ask; every open comp card; for the
  story board the consultant-pinned notes with no reaction that no earlier story task
  covered, capped at `plan-seed.json` `focus.max_story_notes` (8). Refused while another task
  is open (`FOCUS_OPEN`) or with nothing to cover (`NOTHING_TO_FOCUS`). **It brings the
  surface in front of the client** through `show_client`'s own path (questions → the first
  question, story → Story, comps → the comparison board): a switch unless the client is
  busy, else a link to paste. The host's cadence wrapper delivers it exactly as a
  `show_client` switch. The browser also declines a switch while the client has unsent text
  in the composer, leaving the recorded "Showing you …" line as their link.
- **`end_focus`** (consultant): closes an open task the client has walked away from, with no
  notice.
- **While a task is open the consultant adds nothing to its surface:** a new ask /
  `ask_features` (questions), `pin_notes` (story) or `add_comp` (comps) is refused
  `FOCUS_OPEN`, saying to add it after they finish. Rewording, answering the client, and
  the other surfaces are unaffected. The talker's discovery reminder is replaced, while a
  task is open, by "your client is working through …: open no new topic, answer them if they
  speak".
- **Done when every item is closed** (ask answered/skipped/withdrawn; note reacted to or
  deleted; card sent or skipped), stamped on every client write and consultant write; or
  **when the client presses Done** on the surface (`POST /api/plan/focus {site, action:
  "done"}`).
- **Completion reaches the consultant on BUG-245's path**: the plan-answers notice gains a
  line naming the task, how it finished and what the client did (hearted notes named), with
  "resume the conversation now". The browser starts the resuming turn on the host's cue,
  which is generalised from `comps_finished` to one **`finished`** cue (the comparison board
  finishing on its own, or a focus task) — refused 409 once the consultant has been told.
- **The surface shows the task**: a shared banner (`focus-banner.js`) at the top of the
  questions panel, the story board or the comparison board — the consultant's line, progress
  ("4 of 8 notes reacted to", "2 of 5 questions left", "1 of 3 sites left") and **Done**.
  Pending items are highlighted; on the story board, unreacted notes outside the task that no
  task has covered yet are marked **new**.
- **The consultant's plan reminder** carries the open task and its progress; priming
  describes the cycle (gather → start a focus task, typically right after commissioning a
  build → one line, ask nothing else → resume when told), the small-batch/tidy-board rule,
  and the re-point-once rule using the pane the view report names.