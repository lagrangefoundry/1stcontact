---
uid: acceptance_criterion-405a5205
id: AC-500
type: acceptance_criterion
title: Header exposes logoFont and logoTreatment dials that style a text wordmark
created_by: xgd
created_at: '2026-07-09T21:09:51.052863+00:00'
updated_at: '2026-07-09T21:09:51.052863+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The `header` module exposes two wordmark dials with finite value enumerations: `logoFont` (`heading` | `body` | `display`) selecting the wordmark's font family — where `display` binds the wordmark to the `--font-family-display` custom property — and `logoTreatment` (`plain` | `gold`) where `gold` renders the wordmark glyphs with a metallic-gold gradient fill (clipped to the text) keyed to the accent colour. Both dials apply only to a text wordmark, not an image logo, and default to `heading` / `plain`.

## Verification
Render the header with a text wordmark and assert the wordmark markup carries the font/treatment hooks for the selected dial values (e.g. a display-font class bound to `--font-family-display` and a gold-treatment class), and that it defaults to the heading family / plain treatment when the dials are omitted. Assert the module contract advertises `logoFont` and `logoTreatment` with their finite value sets.
