---
uid: acceptance_criterion-bf0d2b7c
id: AC-1718
type: acceptance_criterion
title: The description, and for uploads only the role, are the editable fields; undescribed
  material says so, and a committed correction is stored as the material's description
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:54.222934+00:00'
updated_at: '2026-11-08T13:55:10.435253+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

The description, which says what the platform understands the material to be, is the main
editable thing on the detail view and is presented as such:

- the editable fields of the detail view are the description and, **for material the client
  uploaded and only for that**, *What it is for* (REQ-213, stated separately). On fetched or
  captured material the description is the only editable field;
- material that nothing has described yet shows, in place of a description, a statement that
  nothing has read it yet and an invitation to say what it is, rather than an empty box with no
  explanation;
- the description is written as markdown and is **shown rendered** — its headings, emphasis and
  lists appear as such rather than as the markers that produce them;
- opening it for editing puts the client in front of the markdown **source**, not the rendered
  result, so what they correct is what is stored;
- committing an edit stores the typed text as that material's description, and the detail view
  and the list row then reflect what the store now holds rather than a guess at what changed —
  with the corrected description shown rendered again once the write lands, and shown as the
  stored text again if the write fails and the control reverts.

## Verification

Select a material carrying no description and observe the "nothing has read this yet" statement,
with the empty description keeping its own placeholder rather than a rendered blank. Select a
material whose description contains markdown and observe it rendered — headings as headings,
emphasis as emphasis — and not as its markers. On an uploaded material, observe that exactly two
fields are editable, the description and *What it is for*. On a fetched or captured material,
observe that exactly one is, the description. Click the description and observe an editor
holding the markdown source. Type a replacement, commit it the way a client does (leave the
field), and observe the new text stored against that material, shown back on the pane as
rendered markdown, and shown in its row.
