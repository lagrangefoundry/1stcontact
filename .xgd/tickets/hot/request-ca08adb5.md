---
uid: request-ca08adb5
id: REQ-417
type: request
title: 'Opening experience: centred story-board message, clearer headline slot, ghost
  text on the empty question panel'
created_by: EPIC-19
created_at: '2026-10-20T14:34:52.107085+00:00'
updated_at: '2026-10-20T14:34:52.107085+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 2
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## What changes (operator, 2026-10-20)

Three tweaks to what a client sees when a new business opens.

1. **Story board empty message, centred.** "As we talk, I'll pin the things you
   say about your business here. Heart the ones that are most you."
   (`STORY_EMPTY`, `apps/control-app/src/builder/config.js`) appears in the
   middle of the story board — centred **vertically as well as horizontally** in
   the area below the headline slot — while the board has no notes. It goes as
   soon as the first note is pinned.

2. **Headline slot wording, clearer.**
   - The label `STORY_HEADLINE_LABEL` changes from "The headline" to
     **"Your headline statement:"**.
   - The empty slot's shadow text `STORY_HEADLINE_PLACEHOLDER` changes from
     "The headline… why you?" to **"Why choose your business?"**, and is
     **centred** in the slot.
   - Only the empty state changes; offered options, chosen and client-edited
     states (REQ-408) are unchanged. The board keeps its own style.

3. **Question panel ghost text.** While the question panel has no questions at
   all (neither OPEN QUESTIONS nor WHAT YOU'VE TOLD US is shown — REQ-403/401),
   it shows grey ghost text **"We'll put questions here for you to answer"**, in
   the panel's own type, not styled as a question or a button. It disappears when
   the first question is added and doesn't return once questions exist. The
   string lives with the other builder wording in `config.js`.

## Test plan

- Story pane UAT: with an empty board, the empty message is present and centred
  in both axes of the board area; after a pin it is gone.
- The headline label reads "Your headline statement:" and the empty slot's
  placeholder reads "Why choose your business?", centred; REQ-408's chosen /
  options states are unchanged. Update `test_UAT_FC_REQ-408_story_pane` (and
  REQ-260 if it pins these strings) to the new wording.
- Plan panel UAT: a plan with no asks shows "We'll put questions here for you to
  answer" and neither section; adding an ask removes it.
