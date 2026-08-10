---
uid: acceptance_criterion-651ded8e
id: AC-1104
type: acceptance_criterion
title: A composed drawing is written as an ordinary site image, referenceable from
  a page, and ships into the render unaltered
created_by: xgd
created_at: '2026-08-10T09:34:32.846352+00:00'
updated_at: '2026-08-10T09:34:32.846352+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
A drawing supplied as a complete document is written into the site under a generated filename and registered as an image, with the alt text given. The response hands back the handle a picture element takes, so the caller can use the answer directly rather than composing a path. The site's image listing — the same listing every image picker reads — reports it as an image. Referencing it from a picture element and rendering the site emits the reference document-relative and copies the drawing's bytes into the output unchanged.

## Verification
Write a drawing, assert the returned handle is the site-local image form and the listing reports it with image kind. Reference it from a page's picture element, render, and assert the rendered markup carries a document-relative reference and that the emitted asset's bytes are byte-identical to what was sent.
