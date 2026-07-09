---
uid: acceptance_criterion-64c348b7
id: AC-523
type: acceptance_criterion
title: Per-band scrim overlay and content vertical anchor are captured
created_by: xgd
created_at: '2026-07-09T22:45:21.139164+00:00'
updated_at: '2026-07-09T22:45:21.139164+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
For each captured band, `capture.json` records two section-level treatments derived from the rendered DOM. (1) A **scrim**: when a visible full-bleed descendant (covering ≥60% of the band) paints a semi-transparent background (0 < alpha < 1) that is separate from the band's own background, the most-covering such layer is recorded on the band's `background.overlay` (`{color, opacity}`), taking precedence over any gradient-in-image overlay. (2) A **content vertical-anchor ratio** on `layout.contentAnchorRatio`: the content block's centre as a fraction of band height (0 = top, 0.5 = centred, 1 = bottom), measured from geometry so it reads identically whether achieved by padding or flex justification, and `null` when the band paints no text.

## Verification
Capture a hero fixture with a translucent full-bleed overlay div (e.g. `#020617` at ~0.45) over an image and its text pushed toward the bottom. Assert the first section's `background.overlay` records the scrim colour and opacity, and that `layout.contentAnchorRatio` reflects the low (>0.6) anchor. Capture a band with no text and assert its `contentAnchorRatio` is `null`.
