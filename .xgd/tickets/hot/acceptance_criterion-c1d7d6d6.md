---
uid: acceptance_criterion-c1d7d6d6
id: AC-1310
type: acceptance_criterion
title: A run's geometry is measured per text node when its element holds more than
  one run
created_by: xgd
created_at: '2026-08-20T04:35:55.447837+00:00'
updated_at: '2026-08-20T07:17:42.930847+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A text run's box and glyph box are measured over the geometry that actually describes *that run*, under a two-branch rule:

- An element holding **more than one** run (text split by a `<br>`) yields one run per text node, each carrying **its own** rendered box measured over that node.
- An element holding **exactly one** run is measured off the **element**, unchanged from prior behaviour.

Two runs therefore share an identical rendered box only when their source elements genuinely occupy the same rect. Two consequences follow and are part of the criterion: a fold consuming the manifest cannot stack the runs of one split element at a single coordinate, and `nowrapFromPx` — which derives a run's line count from `renderedTextBox.height / lineHeightPx` — reads each run's own line count rather than the pair's, so a one-line run is not classified as two-line.

## Verification
Capture a page containing an element split by a `<br>`; assert it yields one run per text node, each carrying its own rendered box, with y-coordinates matching their painted lines, and assert a single text node that wraps across two lines remains **one** run whose glyph box spans both lines. Capture an element holding exactly one run and assert its box is the element's box (unchanged). Assert two runs whose source elements genuinely occupy the same rect still record identical boxes. Assert each of the split element's one-line runs derives a line count of 1 from its own `renderedTextBox.height / lineHeightPx`, not 2.
