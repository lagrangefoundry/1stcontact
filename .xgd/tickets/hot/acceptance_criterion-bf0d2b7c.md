---
uid: acceptance_criterion-bf0d2b7c
id: AC-1718
type: acceptance_criterion
title: The description is the one editable thing, undescribed material says so, and
  a committed correction is stored as the material's description
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:54.222934+00:00'
updated_at: '2026-09-14T07:06:46.781469+00:00'
completed_at: null
last_field_updated: body
status: active
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
emphasis as emphasis — and not as its markers. Observe that exactly one field on the pane is
editable and that it is the description. Click it and observe an editor holding the markdown
source. Type a replacement, commit it the way a client does (leave the field), and observe the
new text stored against that material, shown back on the pane as rendered markdown, and shown in
its row.
