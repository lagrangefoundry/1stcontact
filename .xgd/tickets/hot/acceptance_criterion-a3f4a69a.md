---
uid: acceptance_criterion-a3f4a69a
id: AC-578
type: acceptance_criterion
title: The expected column prints spec field names and units as a paste-able value
created_by: xgd
created_at: '2026-07-13T19:51:26.727634+00:00'
updated_at: '2026-07-13T19:57:11.525337+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-74050e88
  kind: behavior
  regression_only: false
---

## Criterion
On each card, the reference (expected) column prints values using the spec's own
field names and units, so a mismatched row is directly transcribable into the
spec. In particular a flagged font-size row's expected value is the raw pixel
number the spec consumes (e.g. `72`), not a re-formatted or unit-annotated
string, and other parameters likewise appear under their spec parameter names
(e.g. `fontSizePx`, `color`, `box`).

## Verification
Compare a pair with a flagged font-size difference. Assert the expected column
of the font-size row carries the raw reference pixel value in the spec's units,
that the row is labelled with the spec parameter name, and that reading the
expected column yields the exact value an operator would paste into the spec to
correct the reproduction.