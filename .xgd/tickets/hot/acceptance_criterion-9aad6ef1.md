---
uid: acceptance_criterion-9aad6ef1
id: AC-700
type: acceptance_criterion
title: Carousel autoplay/loop ship as vetted client behaviour over a static SSR baseline
created_by: xgd
created_at: '2026-07-22T19:54:26.548100+00:00'
updated_at: '2026-07-22T19:54:26.548100+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
The server-rendered carousel is a static, hand-scrollable snap row on its own
(no JavaScript required). When `autoplay` (optionally with `loop`) is configured,
the rendered carousel carries the markers that opt it into the shipped client
behaviour, and that behaviour advances the track by one slide on a timer, wrapping
from the last slide back to the first only when `loop` is set. The behaviour is
defensive: a single-slide track, a missing element, or an absent timer API leaves
the static baseline untouched and never throws.

## Verification
Render carousels with autoplay off, autoplay on, and autoplay+loop; assert the
autoplay/loop opt-in markers appear only when configured. Drive the shipped
carousel client behaviour against a rendered track with an injectable timer and
assert it advances one slide per tick and wraps to the first slide only under
`loop`; assert a one-slide track and a missing track leave the baseline unchanged
without error.
