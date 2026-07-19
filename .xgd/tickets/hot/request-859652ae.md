---
uid: request-859652ae
id: REQ-73
type: request
title: 'values-diff: adjacent-gap axis (relative vertical spacing) + drop section
  band-padding noise'
created_by: xgd
created_at: '2026-07-18T20:25:38.831919+00:00'
updated_at: '2026-07-18T20:36:35.254967+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: f028323bb2728415e10156cfc54b0cae47107ca9
    reconcile_sha: null
    main_sha: null
  version: 0.0.148
---

## Goal
Measure vertical spacing in the coordinate that matters — the **gap between adjacent
elements/rows** (relative), not the band-padding *component* or the *absolute* position.

## Why
A vertical gap is emergent (Type-B) but LINEAR in one authored knob: `gap = base + padding`.
The diff reported the wrong coordinates — section `paddingTop/Bottom` (one component of the
sum) and absolute `position` (which accumulates drift down the page) — so matching them
fought the visual (the padding-vs-margin squish). The reference and we distribute the SAME
gap across different contributors (it via margins, us via padding); only the SUM matters.

## Changes
1. New `gap` axis: group paired elements into visual rows (by y-overlap), compute the gap
   between consecutive rows on each side, emit a `gap` delta (ref-gap -> our-gap, magnitude
   |Δ|). Drift-free: one wrong gap = one delta, not a cascade of position deltas.
2. Drop the section band-padding (`paddingTopPx`/`paddingBottomPx` on §N) deltas — a
   component superseded by `gap`; matching it is padding-vs-margin noise.
3. The gap delta's expected->actual IS the correction: `Δ = ref_gap - our_gap` is exactly how
   much to add/remove from the one spacing knob (the linear inversion).