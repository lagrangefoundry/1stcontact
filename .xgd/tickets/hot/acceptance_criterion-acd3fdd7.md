---
uid: acceptance_criterion-acd3fdd7
id: AC-2556
type: acceptance_criterion
title: The Library name is one field in the detail pane and the modal, committed through
  one call to the material's title, never its filename, and it persists
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:43:30.325796+00:00'
updated_at: '2026-11-09T18:43:30.325796+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

A material's **Library name** — the name its row is listed under — is editable, and it is **one
field in two places**:

- every material's detail pane shows a *Name in your Library* field, below the preview and above
  the description, in its own block rather than in the rights record; the image modal shows the
  same field above the picture;
- committing in either place (leaving the field) writes the name with no separate save, through
  one call, `POST /api/material/name` with `{uid, title}`, and the stored name is the material's
  **title**. The **filename is not changed**: the download still saves under the name the file
  arrived with, and the record's *File* row still shows it;
- after a commit, from the one answer the origin returns: the list row is relabelled, the pane's
  field and an open modal's field both show the new name, and the modal's accessible name and the
  picture's alternative text follow it. Reselecting the row, or reloading, shows the new name;
- an empty or whitespace-only name is refused: the field puts the client's previous name back and
  shows *"Give it a name — this is what you will find it by."*, and a direct request is answered
  400 with its reason and the stored name unchanged. A request with no uid, or with a title that
  is not a string, is 400; a uid that is not this account's material is answered not-found and
  changes nothing;
- a name changed elsewhere (another tab, the assistant) reaches the open detail's field through
  the Library's change feed — except while the client is part-way through editing the name, when
  what they are typing wins.

## Verification

Select a generated picture listed under its prompt, type a new name in the pane's field and
leave it: observe one POST to the name route, the list row relabelled, and the download link and
*File* row unchanged. Open the modal and observe the same name there; rename it in the modal and
observe the pane's field and the row follow. Reload and observe the name kept. Clear the field
and leave it: observe the old name restored and the refusal sentence shown, and a direct POST with
`"   "` answered 400. Rename the material from a second session while the first has its detail
open and observe the field update; repeat with the first client mid-edit in the name field and
observe their text left alone.
