---
uid: acceptance_criterion-5d430c11
id: AC-2425
type: acceptance_criterion
title: Marked Points leaves published and standalone edit renders and the click-to-edit
  bridge unchanged
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:46:50.976392+00:00'
updated_at: '2026-11-08T12:46:50.976392+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- A published page and an edit render produced without the builder (`1c render --edit`) contain none of the Marked Points markup or styles: no point container, no point marks, no mode marker on the body, and no overlay stylesheet.
- The overlay's styles and marks appear in the preview document only while the builder has Mark Points on. Turning the mode on needs no re-render.
- With the mode turned off, the preview document contains no overlay styles, marks container or mode marker, and clicking a segment opens its editor exactly as it did before the mode was ever turned on.

## Verification
Render a fixture site both published and with `1c render --edit`, and assert the HTML bytes contain no Marked Points class names, mode marker or overlay CSS. In the builder harness, turn the mode on, assert the overlay appears without the document being replaced, turn it off, assert the overlay elements and marker are gone, and assert a segment click opens its editor.
