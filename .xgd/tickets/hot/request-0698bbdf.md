---
uid: request-0698bbdf
id: REQ-72
type: request
title: capture gradient colour stops (hexify modern colour spaces in-browser)
created_by: xgd
created_at: '2026-07-18T18:17:56.313634+00:00'
updated_at: '2026-07-19T01:04:53.468287+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 4fb1c41810709ec1a04e9e2e72fd118733483b8f
    reconcile_sha: null
    main_sha: null
  version: 0.0.147
---

## Goal
Capture a surface/text gradient's colour STOPS. A gradient authored with Tailwind classes
computes to a modern colour space (oklch/oklab/color()), which the TS-side `normalizeGradient`
stop regex (only `#hex`/`rgb`) can't parse — so the gigabytealchemy card gradient captured as
`135° []` (angle only, empty stops), leaving the `surfaceGradient` axis unreproducible (3 [[REQ-64]]
Type-A deltas that read as a capture gap, not a framework gap).

## Approach
Resolve each gradient colour token to `#rrggbb` IN THE BROWSER (extract.ts), where a probe
element + getComputedStyle resolves any colour format the browser understands — then the
existing `normalizeGradient` parses the hex stops. Apply to both the text-fill `gradientCss`
and the panel `surfaceGradientCss` capture. Re-capture gigabyte; the stops then populate.