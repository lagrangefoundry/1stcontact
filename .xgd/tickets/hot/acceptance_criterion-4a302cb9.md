---
uid: acceptance_criterion-4a302cb9
id: AC-2104
type: acceptance_criterion
title: The layout reference documents the page itself — every top-level document key
  and the shapes those keys reach — not only the element kinds
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T09:19:03.411461+00:00'
updated_at: '2026-11-01T09:24:18.573583+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

The layout reference has a section describing the page document itself, under
its own heading, ahead of the element kinds. That section carries one field line
for every top-level key the page document declares — the viewport widths, the
page background, the text colour, the content column, the resource table, and
the element tree it holds — each with the type words read from the schema and,
where the schema carries prose for that key, that prose. A key that can be
written through the page-style operations is never absent from it.

The shapes those document keys reach (the column, the resource table, a font
face) are described in the existing section for shapes, exactly once each, and
not duplicated into the page section.

The key list is read from the page-document schema, so declaring a new
top-level key and regenerating adds it to the section with nothing else edited.

## Verification

Read the generated layout reference: a page-document section exists; every
top-level key of the page-document schema (derived from the schema at check
time, not listed in the test) appears in it with a type beside it; the viewport
widths are described as a list of numbers; the font-face shape is described
once, in the shapes section, with its family and source fields.