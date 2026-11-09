---
uid: acceptance_criterion-c103782e
id: AC-2554
type: acceptance_criterion
title: Clicking the same picture in the chat opens the same image modal, including
  for the business-scoped addresses the builder itself forms
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:43:25.792623+00:00'
updated_at: '2026-11-09T18:43:25.792623+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

A picture in the conversation and the row in the Library are one material, so **clicking that
picture in the chat opens the same image modal** the Library opens — the same name field, the
same four tools, the same undo and redo, writing through the same two calls:

- a picture whose address is the material file address for a material opens the modal for that
  material — **whether or not the address carries the business scope prefix** (`/b/<business>/…`)
  the builder puts on every address it forms while a business is selected, which is every real
  session. A picture the builder itself placed in the conversation is therefore always openable
  by the builder's own click;
- the material is read **before** the modal opens, so the modal opens on the material's current
  name and its recorded edits, never on the unedited picture;
- the click leaves the picture where it is, and opens nothing, when the address names anything
  else — a picture from elsewhere on the web, or one named file inside a capture — when the
  material is not one the editor applies to (a capture or a drawing), or when the material
  cannot be read;
- only one modal is opened from the chat at a time;
- a chat pane mounted without asking for this behaviour has no click behaviour on its pictures
  at all.

## Verification

With a business selected, put a picture in the conversation whose address is the builder's own
material file address for an editable picture (scope prefix included) and click it: observe the
image modal open on that material, with its Library name and its stored edits. Repeat with the
unscoped address and observe the same. Click a picture whose address is an external URL, and one
whose address names a member of a capture, and observe no dialog. Click a picture whose material
is a drawing and observe no dialog. Make the material read fail and observe no dialog and no
error. Mount a chat pane without the option, click a picture, and observe nothing happen.
