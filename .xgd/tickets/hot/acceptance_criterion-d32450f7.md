---
uid: acceptance_criterion-d32450f7
id: AC-1774
type: acceptance_criterion
title: A ladder screenshot is retrievable by width, and a width the ladder never shot
  reads as absent
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:49:56.951826+00:00'
updated_at: '2026-09-14T04:49:56.951826+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
A bundle's per-width reference screenshot is retrievable by asking for a width
rather than by composing a location:

- asking for a width the ladder was shot at returns that width's image bytes,
  beginning with the PNG signature
- asking for a width the ladder was **never** shot at reports absence, so a
  size-aware comparison fails loudly rather than silently falling back to the
  desktop shot and reporting a fidelity verdict against the wrong image
- the member is named `screenshot-<width>.png` on every backing, because that name
  is what makes a locally written and a cloud written bundle the same artifact

## Verification
Write a ladder screenshot for one width into a bundle, on each backing. Assert
retrieval at that width returns bytes starting with the PNG signature; assert
retrieval at an unshot width reports absence; assert the enumerated member key for
that width is `screenshot-<width>.png`.
