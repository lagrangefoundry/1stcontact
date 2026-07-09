---
uid: acceptance_criterion-186f1f12
id: AC-530
type: acceptance_criterion
title: 'Colour comparison is perceptual: near-neighbour colours flag, imperceptible
  rounding is suppressed'
created_by: xgd
created_at: '2026-07-09T22:59:02.569878+00:00'
updated_at: '2026-07-09T22:59:02.569878+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
Colour is compared by perceptual distance with a tight default tolerance: a difference of roughly one unit per channel (re-render rounding) does not produce a colour delta, but a near-neighbour design colour — the flagship gold-vs-gold `#f5e6a3` vs `#fbba72` — does produce a colour delta. An unparseable colour is never silently treated as a match.

## Verification
Diff paired runs whose colours differ by ±1 per channel and assert no colour delta; diff `#f5e6a3` against `#fbba72` and assert a colour delta is emitted.
