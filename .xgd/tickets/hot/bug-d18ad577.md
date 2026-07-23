---
uid: bug-d18ad577
id: BUG-7
type: bug
title: evaluateLayout row/flow layout assigns full parent width to every child (rows
  overflow)
created_by: xgd
created_at: '2026-07-23T02:01:22.782832+00:00'
updated_at: '2026-07-23T02:39:50.640527+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  severity: medium
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: e4bdbe029ea611b3e50867c58a4ed5d784383ccb
    reconcile_sha: null
    main_sha: null
  version: 0.0.172
  story_points: 2
---

Scope under [[request-7ff1bacd]] (REQ-88). **Must land before the folder emits any
row/multi-child structure** (images + containers will), or the analytic
value-render lies about overlap/clip. Gates the folder rebuild.

## Behavior (bug)
In `evaluateLayout`'s flow walk (tools/generate/src/l1/probes.ts) each in-flow
child was given `width: box.width` (the full parent width) and, in the `row`
branch, the cursor advanced by `box.width + gap`. So N row children each took the
full parent width and were placed a full width apart — they spanned N×parentWidth
and overflowed. Column stacking was roughly right; row was wrong. Latent today
only because the folder never emits `row` containers yet.

## Fix (landed)
Split the container flow-walk into a row branch and a stack branch that mirror
the renderer's CSS (`render.ts` container branch):

- **Row** — children sit side by side, each taking its own main-axis width, and
  the cursor advances by that width. Widths come from `rowChildWidths`: a child
  that declares a fixed `sizing.width` takes it (clamped to min/max via
  `fixedWidth`); the remaining children share the leftover extent equally (the
  analytic stand-in for flex-grow / natural width, so a well-formed row tiles its
  parent without overlap or overflow). The row's height is the tallest child
  (cross axis). Fixed widths that genuinely exceed the extent still surface a real
  clip — the fix removes *false* overflow, not real overflow.
- **Stack** (`box` / `stack` container) — unchanged: children fill the width and
  stack vertically. **Grid** is modelled as a stack (envelope-conservative; the
  folder does not emit grid yet).

Kept analytic / browser-free. Removed the dead `maxChildRight` accumulator.

## Test plan
`tests/bug7-row-layout.test.ts` (`test_UAT_FC_BUG-7_*`):
- `row_children_tile_side_by_side` — 3 flex children share the extent (gap-aware),
  laid left→right, no overlap, no overflow.
- `row_offsample_no_false_overflow` — the exact regression: `offSampleProbe` on a
  row is now clean at 500/900px.
- `row_fixed_width_children_placed_by_own_width` — fixed boxes take declared
  widths; the flex child takes the remainder.
- `row_genuine_overflow_still_flagged` — real fixed-width overflow still clips.
- `column_stack_unchanged` — regression guard for vertical stacking.
- `row_matches_browser` — analytic boxes match a real Chromium row fixture within
  tolerance (skipped without a browser engine).
