---
uid: acceptance_criterion-3eae0d6b
id: AC-1650
type: acceptance_criterion
title: Copy inside a component the assistant instantiated is addressable and editable
  in the operator's modal
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:09:49.219016+00:00'
updated_at: '2026-09-11T03:09:49.219016+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
Copy inside a component instance the assistant created is addressable and editable through the operator's click-to-edit modal, exactly as copy in a hand-authored subtree is, over the same `/api/copy` transport the browser uses. Nothing is added to the modal's own contract to make this true: it holds because what a component instantiation produces is ordinary page content in the same element tree, and the page's segment walk enters a module slot like any other subtree.

## Verification
Add a component to a page through the control surface with a configuration that produces visible copy — a contact form with one labelled field. Describe the page and confirm the segment map reports segments inside that instance, among them a text run for the visible field label. Against a running builder, read that run over `/api/copy` using the path, module and slot the map reported: the read returns the text run. Then post a changed value to the same endpoint and confirm the new copy is what the site and a subsequent read report.

## Evidence
Already evidenced by `test_UAT_FC_REQ_130_copy_inside_the_component_is_addressable_and_editable`
(`tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:670`, under the describe block "REQ-130 — the
modal still reaches copy inside an AI-added component", `:645`). This criterion is expressing an
already-proven behaviour that had no criterion above it, not requesting a new test.
