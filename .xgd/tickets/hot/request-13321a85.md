---
uid: request-13321a85
id: REQ-621
type: request
title: 'Site consultant: introduce Input one place and one action at a time — Questions
  first, then Stories, then Comparison sites'
created_by: EPIC-19
created_at: '2026-10-31T20:22:17.014511+00:00'
updated_at: '2026-10-31T20:22:17.014511+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
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
