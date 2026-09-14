---
uid: acceptance_criterion-d483414e
id: AC-1788
type: acceptance_criterion
title: Decode cost for a full-page screenshot is measured and reported on every run,
  and held under a stated ceiling
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:06:38.264744+00:00'
updated_at: '2026-09-14T05:16:31.774392+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
The cost of decoding a screenshot-shaped image is a recorded number rather than an
assumption. Each run measures the decode of a tall fixture, reports the elapsed
time, the cost per megapixel, and the projection for a full-page desktop
screenshot of roughly six megapixels, in output an operator can read. The
projected full-page cost is also held under a deliberately loose ceiling — well
under a second's worth of headroom — so that a regression which doubled it is
caught rather than merely recorded.

The ceiling is loose on purpose: this is a smoke bound against a busy machine, not
a benchmark. The number exists because the decision to own the codec is reversible,
and this measurement is what would reopen it.

## Verification
Decode a tall fixture several times, take the best run, and emit the elapsed time,
the per-megapixel rate and the full-page projection. Assert the projection is under
the stated ceiling.