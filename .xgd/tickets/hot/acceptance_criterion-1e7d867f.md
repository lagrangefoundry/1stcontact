---
uid: acceptance_criterion-1e7d867f
id: AC-1311
type: acceptance_criterion
title: The surface-bearing box is captured, and shape/border/surface geometry resolve
  against it when the two sides split a control differently
created_by: xgd
created_at: '2026-08-20T04:36:00.316232+00:00'
updated_at: '2026-08-20T05:04:34.169577+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The capture records **which box paints a run's surface**, and `values-diff` resolves that run's shape, border and surface geometry against it.

**Captured.** A run carries a `surface` record — a `self` discriminator, the bearing box in **document coordinates**, and that box's corner radius, box-shadow and uniform border — resolved tightest-first over the same geometric surface chain `surfaceFill` walks. `self` is true where the run's own element paints the surface and false where a *sibling backing box* does. Nothing painting behind the run records `null`.

**Diffed.** When the two sides disagree about node identity, `shape` (radius + shadow), `border` and the bearing box's own geometry are compared against that bearing box rather than against the matched node's own computed style. The resolution is deliberately narrow and fires only on genuine identity disagreement:

- A split control (reference `<button class="rounded bg-…">` vs a reproduction whose label is a text node beside a separate backing box) compares against the backing box, so no phantom `radius 8px → 0px` is reported — and no Type-A flat step that leads the printed repair order with no value to copy.
- An element that self-paints on **both** sides (`self: true`) compares on its own axes, unchanged.
- An ordinary run sitting on its band raises **no** surface-geometry rows, so the resolution introduces no per-run band noise.
- A reproduction that genuinely lost its rounding still reports `shape`.
- A bundle captured before the `surface` record existed carries none, leaving the resolution inert.

## Verification
Capture a conventional page whose control is a single rounded, filled `<button>`; assert the run's `surface` records `self: true` with the element's own radius, shadow and border, and its box in document coordinates. Capture a flat reproduction of the same control (label text node plus sibling backing box); assert `self: false` and that the recorded box/radius are the **backing box's**, not the label's zeros. Diff the two and assert no `shape` delta is reported. Re-diff with the backing box squared off and assert a `shape` delta *is* reported. Diff a page whose runs sit on an ordinary band and assert no surface-geometry rows appear. Diff a pre-`surface` bundle and assert the resolution emits nothing.