---
uid: acceptance_criterion-2732cbdf
id: AC-787
type: acceptance_criterion
title: A bound seam renders the behaviour's markup inside its positioned box; an unbound
  seam stays an inert labelled placeholder
created_by: xgd
created_at: '2026-08-03T03:20:57.163853+00:00'
updated_at: '2026-08-03T03:20:57.163853+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-02f21b8a
  kind: behavior
  regression_only: false
---

## Criterion

Rendering a page whose seam has a bound behaviour emits that behaviour's markup
as the content of the seam's own positioned box — the box keeps its seam name and
position, and the behaviour's markup is nested inside it rather than appended
beside the page body. Rendering the same document with nothing bound to the seam
emits the box as an inert placeholder labelled with the seam name and the
behaviour it expects, containing no behaviour markup. Markup offered for a name
that is not a seam in the document appears nowhere in the output.

## Verification

Render an L1 document with a seam three ways — with a fragment bound to the
seam's name, with nothing bound, and with a fragment bound to an unrelated name —
and assert in turn: the seam's box contains the fragment; the seam's box is the
empty labelled placeholder; and the unrelated fragment appears nowhere. Render
the full reproduction end to end and assert the behaviour's markup is nested
within the seam's box in the published page.
