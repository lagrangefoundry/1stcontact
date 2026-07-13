---
uid: acceptance_criterion-77c95c85
id: AC-587
type: acceptance_criterion
title: A per-axis tolerance override loosens one axis and overrides both modes
created_by: xgd
created_at: '2026-07-13T20:01:02.652355+00:00'
updated_at: '2026-07-13T20:09:23.220907+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-dadb8475
  kind: behavior
  regression_only: false
---

## Criterion
Supplying a per-axis tolerance override (for colour, position, width, height, or
corner radius) suppresses differences within that override on that one axis only,
while every other axis remains exact. The override takes precedence over both the
exact default and the tolerant opt-out — it wins whether or not the blanket
opt-out is also in effect.

## Verification
Compare a pair that differs on two axes at once (e.g. an element position offset
and a colour drift). With only the position override set large enough to cover the
offset, assert the position delta is suppressed while the colour delta is still
reported. Confirm the override still applies (suppresses that axis) when combined
with the tolerant opt-out.