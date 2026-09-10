---
uid: acceptance_criterion-e7641019
id: AC-1605
type: acceptance_criterion
title: A run's rendered extent is measured off the node that owns its glyphs
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:47:47.209908+00:00'
updated_at: '2026-09-10T00:47:08.467744+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A run's rendered-text extent is measured off **the node that owns its glyphs**, not
unconditionally off the element. An element contributes its own rendered text box
only when it owns *exactly one* text run. An element owning more than one run — a
paragraph broken by a `<br>`, a heading with a nested span, any node whose text
arrives in several pieces — measures each run's extent off that run's own **text
node** instead.

Giving every run of a multi-run element that element's box makes each run claim the
full block: the extents come out identical to each other and far larger than the
glyphs they describe. The ratio comparison of AC-629 / AC-630 is then comparing
container widths rather than text, so a genuine per-line difference is buried and a
downstream fold positioning the runs prints them on top of one another.

## Verification
Capture a page carrying (a) a single-run heading and (b) both multi-run shapes — a
`<br>`-broken paragraph and a heading with a nested span. Assert the single-run
element's captured extent is its own rendered text box. Assert each run of the
multi-run elements carries a *distinct* extent matching that run's own text-node
rect — differing from its siblings' and narrower than the shared element box. Then
diff a reproduction that differs on one line only of the `<br>`-broken paragraph and
assert a rendered-text-extent delta is reported for that line alone.