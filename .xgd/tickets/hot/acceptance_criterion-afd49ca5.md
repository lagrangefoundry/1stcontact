---
uid: acceptance_criterion-afd49ca5
id: AC-2463
type: acceptance_criterion
title: The builder's empty detail state is one styled box shared by the Library and
  Contacts
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T14:25:09.915984+00:00'
updated_at: '2026-11-08T14:25:09.915984+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

When nothing is selected, the detail pane of the Library and of the Contacts
tab shows its prompt (for example *"Pick something on the left, or drop a file
here to add one."*) inside an element, never as a bare text node.

- **One shared state.** The two panes use different words but the same styled
  box: one class, matched by one rule in the builder stylesheet.
- **A designed state.** The box is centred in the pane, padded and muted, and
  its text is at the control font-size token, not the browser default.

## Verification

Mount the Library and the Contacts tab with nothing selected. Assert that the
detail body holds no non-blank bare text node. Assert that it holds an element
carrying the shared empty-state class, and that this element contains the
prompt. Assert that the builder stylesheet has a rule for that class, and that
the element's size resolves to a declared size through its ancestry rather than
to the browser default.
