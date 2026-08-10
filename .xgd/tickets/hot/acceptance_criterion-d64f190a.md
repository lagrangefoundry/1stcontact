---
uid: acceptance_criterion-d64f190a
id: AC-876
type: acceptance_criterion
title: 'Importing a reproduction replaces the page document wholesale: the result
  over a freshly created slug is identical to the result over a slug that never existed'
created_by: xgd
created_at: '2026-08-06T03:43:23.253683+00:00'
updated_at: '2026-08-10T08:16:09.831596+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-86c7c21b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Importing the same reference bundle into a slug that was just created (and so
carries the starting skeleton) and into a slug that never existed produces
identical page documents, modulo the slug name itself. Specifically, after an
import over a created slug: the widths, the document background and every node
are those of the imported reproduction, and no scaffolded width, background
colour or placeholder run survives.

## Verification
Import one reference bundle twice into a shared workspace — once into a slug that
was never created, once into a slug created immediately beforehand — and assert
the two resulting page documents are byte-identical after normalising the slug
name. Additionally assert the imported page's widths and background are the
bundle's own values and that no placeholder node from the starting skeleton
remains.