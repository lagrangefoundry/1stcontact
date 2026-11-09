---
uid: acceptance_criterion-1e42ad48
id: AC-2558
type: acceptance_criterion
title: Undo and redo step through the operations made in the sitting and persist the
  resulting recipe at each step
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:43:34.613440+00:00'
updated_at: '2026-11-09T18:43:34.613440+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

**Undo** and **Redo** step through the operations made in this sitting of the modal, and every
step is persisted:

- Undo is unavailable before anything has been done in the sitting, and Redo is unavailable at the
  newest step;
- each Undo or Redo moves exactly one operation and **saves the resulting recipe** at once, then
  re-fetches the picture — so the record always holds the picture the client is looking at;
- making a new change after stepping back discards the steps that were stepped out of;
- the history belongs to the sitting: closing the modal ends it. The recipe persists, so
  reopening shows the picture as last saved, with the recorded operations intact and no Undo
  available until something new is done. Operations recorded before the sitting are not undone
  by the sitting's Undo.

## Verification

Open a picture with no edits; observe Undo and Redo both unavailable. Turn it right, then resize:
observe two saves. Undo: observe a save of the one-entry recipe and Redo now available. Redo:
observe a save of the two-entry recipe. Undo, then turn left: observe Redo unavailable and the
saved recipe ending in the 270° turn. Close and reopen: observe the picture as last saved and
Undo unavailable.
