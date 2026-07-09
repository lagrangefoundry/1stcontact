---
uid: acceptance_criterion-5594ab57
id: AC-524
type: acceptance_criterion
title: Unresolvable run colour is flagged colorInferred; new fields optional
created_by: xgd
created_at: '2026-07-09T22:45:26.159018+00:00'
updated_at: '2026-07-09T22:45:26.159018+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
When a content run's painted colour cannot be resolved from computed styles (a transparent/unpainted text colour), `capture.json` sets that run's colour to a `#000000`/`#ffffff` sentinel and flags the run `colorInferred: true`, marking the value low-confidence. A run with a genuinely resolved colour is not flagged. All of the added per-element and section fields (`colorInferred`, `lineHeightPx`, `letterSpacingPx`, `gradient`, `borderLeft`, `paddingLeftPx`, `background.overlay` scrim, `layout.contentAnchorRatio`) are optional, so a pre-REQ-31/REQ-35 bundle that omits them still parses.

## Verification
Capture a fixture with one run whose computed colour is transparent/unpainted and one solid-coloured run. Assert the unresolvable run's colour falls back to the sentinel and carries `colorInferred: true`, while the solid run is not flagged. Parse a bundle written without the new fields and assert it loads without error.
