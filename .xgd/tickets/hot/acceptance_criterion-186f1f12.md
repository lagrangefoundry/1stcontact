---
uid: acceptance_criterion-186f1f12
id: AC-530
type: acceptance_criterion
title: 'Colour comparison is perceptual: near-neighbour colours flag, imperceptible
  rounding is suppressed'
created_by: xgd
created_at: '2026-07-09T22:59:02.569878+00:00'
updated_at: '2026-07-10T01:46:39.827431+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
Colour is compared by perceptual distance in **OKLab** (ΔEOK — the space CSS `oklch()` is built on), with a tight default tolerance of ~0.02 (the just-noticeable band). Imperceptible per-channel re-render rounding (e.g. `#808080` vs `#818080`, ΔEOK ≈ 0.0015) does not produce a colour delta, but a near-neighbour design colour — the flagship gold-vs-gold `#f5e6a3` vs `#fbba72` (ΔEOK ≈ 0.105), or a near-black-vs-slate body tone `#111111` vs `#334155` (ΔEOK ≈ 0.198) — does. Because OKLab is perceptually uniform, one tolerance holds across the gamut (unlike raw RGB, which over/under-weights greens and darks). An unparseable colour scores an infinite distance, so it is never silently treated as a match. A reference colour the capture had to infer (fallback sentinel) never produces a hard colour delta.

## Verification
Diff paired runs whose colours differ by imperceptible per-channel rounding and assert no colour delta; diff `#f5e6a3` against `#fbba72` and assert a colour delta is emitted; diff against an unparseable colour token and assert it is not treated as a match.
