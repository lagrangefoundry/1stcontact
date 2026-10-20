---
uid: request-ca08adb5
id: REQ-417
type: request
title: 'Opening experience: centred story-board message, clearer headline slot, ghost
  text on the empty question panel'
created_by: EPIC-19
created_at: '2026-10-20T14:34:52.107085+00:00'
updated_at: '2026-10-20T15:28:16.903678+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 2
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c5d6f79a
  commits:
  - working_sha: 72349a9a0deda83d3831367012a35bcab60534a6
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 2c8b0ba00020eb16bc8da3942e70cb30f1f4d15b
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 6f631d6b4fb7ff9e63f4b24c0dfb2f51918816ee
    reconcile_sha: null
    main_sha: null
  - working_sha: eb334baabfd57219527c9a8f44ee27d868fba63c
    reconcile_sha: null
    main_sha: null
  version: 0.2.555
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
   the panel's own type, not styled as a question or a button, **centred in the
   panel both vertically and horizontally** (in the space below the progress
   tracker). It disappears when
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



## What landed (2026-10-20)

- `config.js`: `STORY_HEADLINE_LABEL` = "Your headline statement:" (also the slot's aria-label), `STORY_HEADLINE_PLACEHOLDER` = "Why choose your business?", new `PLAN_NO_QUESTIONS_YET` = "We'll put questions here for you to answer".
- Story board (`builder.css`): the board is a flex column and `.story-board__empty` takes `margin: auto`, so the message sits in the middle of the space between the headline slot and the bottom of the board, both ways. As a consequence of the column layout the headline slot is given `width: 100%` (still capped at 46em) so it keeps its full width rather than shrinking to its text. The placeholder is centred via `.story-headline__line:placeholder-shown { text-align: center }`, so only the empty slot is centred; offered / chosen / client-written text keeps the board's left alignment.
- Plan panel (`plan-panel.js`): a `.plan-panel__ghost` paragraph above the sections, centred both ways in the panel (operator follow-up, 2026-10-20): the panel becomes a flex column only while the ghost shows (`.plan-panel:has(> .plan-panel__ghost:not([hidden]))`) and the ghost takes `margin: auto; text-align: center`, so a panel with questions lays out exactly as before. Shown exactly while both OPEN QUESTIONS and WHAT YOU'VE TOLD US are hidden. Since asks never leave the plan once added, it does not return once a question exists (an all-answered plan still shows WHAT YOU'VE TOLD US). Its rule sets only margin, padding, centring and the shell's muted grey: no font, border, background or cursor, so it reads in the panel's own type and not as a question or button.

## UATs

`tests/test_UAT_FC_REQ-417_opening_experience.test.ts`: empty message present then gone after a pin; headline label and placeholder wording, and centring keyed on `:placeholder-shown` only; ghost text present with no sections, gone after an ask is added and still gone once it is answered, not styled as a question/button; in real Chromium, the ghost text centred horizontally and vertically in the panel and the panel back to ordinary block layout once a question exists; and, in real Chromium, the empty message centred horizontally and vertically under the headline, the headline full-width, the placeholder centred. `test_UAT_FC_REQ-408_story_pane` updated to the new placeholder. Test infra: the Chromium-launch helpers from the BUG-58 suite moved to `tests/support/chromium.ts` and are shared by both suites.