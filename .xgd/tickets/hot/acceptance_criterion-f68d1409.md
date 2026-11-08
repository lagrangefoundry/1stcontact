---
uid: acceptance_criterion-f68d1409
id: AC-2436
type: acceptance_criterion
title: The edit render carries the dialog shell, role, id and overlay stylesheet but
  no script and no acting attribute
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:30.741709+00:00'
updated_at: '2026-11-08T23:47:52.556628+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
The edit render of a document with a modal emits the same modal apparatus as the draft render, minus the behaviour:
- **Present in both channels:** the covering shell carrying the panel's declared id, the panel's `role="dialog"` (with `aria-modal`, and its `aria-label` when declared), and the overlay stylesheet.
- **Absent from the edit render only:** the dialog script. Each action node is still a `<button type="button">` with the same class and declarations as in the draft render, but has none of the attributes that would make it act: no `aria-controls`, no `aria-haspopup`, no `aria-expanded`, and no opens/closes target.

If nothing sets the ready marker, the panel lays out in flow, open and settled, and its copy can be edited. Apart from the missing behaviour, the tag, class, declarations and box for these nodes match the draft render.

(Amended by REQ-215 / bundle-7ba3af93. This replaces REQ-212 acceptance 12's "same element, no shell, no role" in the edit render.)

## Verification
Render the same document through the edit channel and the draft channel. Then assert:
- The edit HTML contains the shell with the panel's id, `role="dialog"` on the panel, and the same overlay stylesheet rules as the draft.
- The edit HTML contains no dialog script.
- The action node is a `<button>` with the same class but no acting attribute, and the draft render does carry those attributes.

In a DOM environment, load the edit HTML with no marker set and assert that the panel's content is visible and lays out in normal flow.
