---
uid: request-13321a85
id: REQ-621
type: request
title: 'Site consultant: introduce Input one place and one action at a time — Questions
  first, then Stories, then Comparison sites'
created_by: EPIC-19
created_at: '2026-10-31T20:22:17.014511+00:00'
updated_at: '2026-11-01T00:22:31.540423+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-255d5238
  commits:
  - working_sha: 97ff4cc3527a4b9dc9cfb67f17fd46425b12694d
    reconcile_sha: null
    main_sha: null
  - working_sha: cbf36fa6c784b2c3a700157d4a4488c7411520f2
    reconcile_sha: null
    main_sha: null
  version: 0.2.720
  story_points: 8
---

## Why

Operator, full site build on production (2026-10-31, Ariel's Arc Welding, chat-db225a61): the opening felt overwhelming. In single turns the client was sent to several places at once and given several things to do:

- **18:55** (after a long pasted price list): one message praised the list, pinned 15 lines on the story board and asked for hearts, posted six questions under Input, and asked a four-way "which customers do you want most" decision.
- **18:57** (after photos): two more questions under Input plus "you're now on the story board".
- **19:06**: a six-bullet recap, four follow-up questions, then "what I need first is the story board".

"Where do I look? What do I click on?" A long pasted answer made it worse, but the pacing should hold whatever the client sends.

Root cause: the one-surface rule exists (stage guide "Focus tasks: walking your client through one surface" — one line saying what to do, ask nothing else, open no new topic), but the consultant only receives it on a "finished" cue (e.g. the 19:05 turn), i.e. after the overwhelm. Meanwhile the story-board guide says pin notes as they talk and questions are posted as they arise, so everything surfaces together — each badged and listed under "How you can help" immediately.

## What

1. **One action per turn, especially at the start.** Each consultant message asks the client to do at most one thing: one place to go, or one question to answer — never both, never two places. The consultant keeps an ordered list of what it wants to present or ask (its queue) and offers the items one at a time, a turn each. Recaps of what the client said are a line at most, not a bulleted summary.
2. **Input places are introduced in a fixed order: Questions, then Stories (story board), then Comparison sites.** Questions comes first because it is the most straightforward.
   - A place counts as **found** once the client has acted on it once: for Questions, answered or skipped any one question; for Stories, hearted, thumbs-downed or edited any one note (or finished the board); for Comparison sites, commented on or skipped any one site (or said they won't compare).
   - The next place is introduced only after the previous one is found. It is introduced in its own message: where to click and what to do there, nothing else to decide.
3. **The host enforces the order, not just the guidance.** The consultant may still gather as the client talks (pin notes, write questions, add comps), but a place not yet introduced stays out of sight to the client: no badge, no "N new", no item under "How you can help", and the consultant's agenda does not tell it to send the client there. A `show_client`/`start_focus` link to a not-yet-introduced place is refused with a reason naming the place that must come first. Once a place is introduced, the items gathered for it appear together.
4. **The one-action rule reaches the consultant from its first turn**, not only on a "finished" cue: the focus-task guidance (or its one-action core) is delivered from the opening onward.
5. **It loosens once every place has been found.** After all three places are found (or skipped, e.g. the client declined comparison sites), the consultant may mention more than one place in a message as it does today. The one-question-per-turn habit still applies to decisions it asks the client to make.

Out of scope: the order of stages themselves (Progress), and the Input tab layout (REQ-619).

## Test plan

UATs named `test_UAT_FC_<this ticket>_*`:
- Before any question is answered or skipped, pinned notes and comps produce no badge, no "How you can help" item, and no agenda line sending the client to Stories/Comparison sites; a `show_client` link to Stories is refused naming Questions.
- After one question is answered (and separately: after one is skipped), Stories becomes introducible and its gathered notes appear together; Comparison sites stays hidden until a note is reacted to.
- The consultant's priming from the opening turn contains the one-action-per-turn rule and the Questions → Stories → Comparison sites order.
- Once all three places are found, a message may link more than one place (no refusal).

## What landed (free-coded)

**Found and hidden, as the host computes them** (`plan-core.ts`, `INPUT_PLACES` / `placeFound` / `placesHidden`):
- Order: `questions` → `story` → `comps` (the focus-task kinds, the same three surfaces).
- Found: Questions — any ask answered or skipped. Story board — any client action on it (a reaction, edit, delete or note of their own; the card; a headline), or the story settled. Comparison sites — any site sent or skipped, or the whole board skipped/done.
- A place is in sight once the place before it is found. A later place found counts for those before it, so a site already past the opening never loses a place it was using. Questions is always in sight.
- Hidden places are left out of `panelView`, the one projection every client surface draws: story hidden → empty board, no `focus_later`, Stories not Complete; comps hidden → no comps, `comps_raised` false, no direction card. So no badge, no "N new", no line under "How you can help" and nothing in Input's section until the place opens. Then everything gathered for it appears together. `panelView` also carries `input_hidden`.

**The consultant may still gather; the host keeps it quiet:**
- A tool result that would link a hidden place (e.g. `pin_notes`, `add_comp`, the direction card) loses its `link`/`new_input` and its `say` becomes "Kept out of your client's sight for now, so say nothing about it: …". So the cadence wrapper owes no "New on the story board" line either.
- `show_client` to `story` / `comp` / `comps` and `start_focus` on `story` / `comps` are refused with `PLACE_HIDDEN` while that place is hidden. The reason names the place that comes first, e.g. "The story board isn't in front of your client yet: Questions come first. Once they have answered or skipped a question, introduce the next place in a message of its own — where to click and what to do there, nothing else". `PLACE_HIDDEN` is declared on the plan surface.
- Agenda (per-turn plan entry): the focus line's "Waiting on the client" names only places in sight; "N new story notes waiting for a reaction task" is not due while the story board is hidden; "Not yet raised: the comp board…" is not said while the sites are hidden; the empty-board line drops "and tell them in one line" while it is hidden. The stage "still needs" facts are kept (they send the client nowhere).

**From the first turn:**
- Consultant rule 5 (rules that hold everywhere, every turn's priming) gains: one action per message (one question or one place, never both, never two places), keep the rest queued and offer it a turn at a time, recap in a line at most, and introduce Input's places in order (Questions, then the story board, then the comparison sites), each in a message of its own once the one before is used. After all three are found, several places may be named in one message.
- The plan entry carries, until every place is found: "Input, one place at a time: <next> now; <hidden…> hidden until it is found. One action per message: one place or one question." Once all three are found the line goes and nothing is refused.

**Design decisions:**
- Strict order even when no question has been posted yet. The refusal tells the consultant to start with Questions, and it can always post one. Gating only when the earlier place has content was rejected because notes would flicker out of sight when a first question arrives.
- The one-action rule is guidance (priming and agenda); the host enforces only the order. Nothing counts links per message.
- DOC-75 (stage guides) is unchanged: the rule now rides every turn through the consultant's rules rather than waiting for the focus-task guide.

## Test plan (as landed)

- `tests/test_UAT_FC_REQ-621_input_one_place_at_a_time.test.ts` (driven through the real Toolbox/plan surface):
  - before any question is found, pinned notes and an added site produce no notes/comps in the client view, no "How you can help" count, no agenda line sending the client to them, no link in the tool results; `show_client` story and `start_focus` story are refused (`PLACE_HIDDEN`) naming Questions;
  - after one question is answered, and separately skipped, the story board opens with both notes together and its count; the sites stay hidden (refusal names the story board) until one note is reacted to, then the site appears;
  - the rules carry the one-action rule and the order, and the opening plan entry carries the places line;
  - once all three are found, Questions, Stories and Comparison sites can all be linked in one turn, and the places line is gone.
- Existing suites that start past the opening now record the earlier places as found through `tests/support/input-places.ts` (`questionsFound`, `storyFound`) and `tests/support/input-places-store.ts` (the same, written to a seeded site's plan for Worker-driven suites).