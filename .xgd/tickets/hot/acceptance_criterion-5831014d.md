---
uid: acceptance_criterion-5831014d
id: AC-796
type: acceptance_criterion
title: Mirrored image and font bytes the page references nowhere are reported as a
  fold gap; page subresources are not
created_by: xgd
created_at: '2026-08-03T03:46:59.184211+00:00'
updated_at: '2026-08-03T03:46:59.184211+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b2f295c
  kind: behavior
  regression_only: false
---

## Criterion
An import reports, as a fold gap, every mirrored asset of kind image or font
whose bytes the bundle carries but which no node of the imported page
references — the bytes were captured yet nothing was emitted to use them.
Mirrored assets that a layout can never reference — stylesheets, scripts, the
document itself — are excluded from that signal rather than reported as noise.
A bundle in which every mirrored image and font is referenced reports no gap.

## Verification
Import a bundle whose asset map contains a referenced image, a referenced font,
an unreferenced mirrored image, and a mirrored stylesheet. Confirm the import's
reported gaps list exactly the unreferenced image, and that the stylesheet is
absent from it. Confirm the same list is empty for a bundle whose images and
fonts are all referenced.
