---
uid: acceptance_criterion-5787336a
id: AC-683
type: acceptance_criterion
title: 'Authored axes round-trip: capture(render(L1)) reproduces every literal axis
  at all widths'
created_by: xgd
created_at: '2026-07-22T19:31:48.950341+00:00'
updated_at: '2026-07-22T19:38:51.640805+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
When an authored L1 document is rendered and the rendered page is re-captured by
a real browser at every declared viewport width, every authored literal
(Type-A) value axis is reproduced within tolerance — the set of Type-A deltas
between the captured manifest and the manifest projected from the L1 document is
empty at each width. Each authored text run is present in the re-captured page.

## Verification
Render the hero spike, serve and capture it across the full width ladder with a
real engine, and for each width assert the round-trip report yields zero Type-A
deltas and that each authored text run (wordmark, subhead) is found in the
captured manifest. Runs on a real engine; skips cleanly where no engine is
installed.