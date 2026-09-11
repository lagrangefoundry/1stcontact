---
uid: acceptance_criterion-bf0d2b7c
id: AC-1718
type: acceptance_criterion
title: The description is the one editable thing, undescribed material says so, and
  a committed correction is stored as the material's description
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:54.222934+00:00'
updated_at: '2026-09-11T05:18:54.222934+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

The description — what the platform understands the material to be — is the single editable thing
on the detail view, and it is presented as such:

- exactly one field of the detail view accepts editing, and it is the description;
- material that nothing has described yet shows, in place of a description, a statement that
  nothing has read it yet and an invitation to say what it is, rather than an empty box with no
  explanation;
- committing an edit stores the typed text as that material's description, and the detail view
  and the list row then reflect what the store now holds rather than a guess at what changed.

## Verification

Select a material carrying no description and observe the "nothing has read this yet" statement.
Observe that exactly one field on the pane is editable and that it is the description. Type a
replacement, commit it the way a client does (leave the field), and observe the new text stored
against that material and shown back on the pane and in its row.
