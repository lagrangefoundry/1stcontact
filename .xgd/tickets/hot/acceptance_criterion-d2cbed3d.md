---
uid: acceptance_criterion-d2cbed3d
id: AC-835
type: acceptance_criterion
title: A row can wrap, restated whole per breakpoint, and one cascade serves both
  renderer and layout gate
created_by: xgd
created_at: '2026-08-06T02:37:18.809936+00:00'
updated_at: '2026-08-08T00:43:22.042169+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
**Wrapping.** A row container declares `wrap`, and children that no longer fit start a new
line instead of squeezing — the "cards reflow when they run out of room" behaviour, with
no breakpoint authored anywhere. Three fixed-width cards in a wide row sit on one line;
in a narrower one the third takes a second line, and the page's layout report finds no
clip. The same row without `wrap` reports a clip at that width.

**Restated whole, never as a delta.** Each breakpoint states its mode in full, so no
combination leaks across the cascade:
- a wrapping row that becomes a stack **resets** its wrapping at the stacking width — a
  column that inherited `wrap` breaks the moment anything constrains its height;
- a grid that becomes a row resets its display rather than layering one mode over the
  other;
- wrapping is inert wherever the resolved mode is not a row.

**One cascade, two consumers.** The rule that resolves which mode is in force at a width
is stated once and drives both the published stylesheet and the analytic layout gate, so
the gate models the layout the page actually renders. Reading the static widest value
instead would model a container that stacks at mobile as a row there, and report the
overlap and clip findings of a layout that is never published.

## Verification
Publish a wrapping row of three fixed-width cards and observe, at a width where they do
not all fit, that the third card starts a new line (sharing the first card's x, below it
in y) with no clip finding, while the same row without `wrap` reports a clip. Publish a
row declaring `wrap` together with a `stack@0 → row@768` track and observe the base rule
carries no wrapping while the 768px block does. Query the resolved mode for a
`stack@0 → row@600 → grid@1024` track at 320/599/600/1023/1024 px and observe
stack/stack/row/row/grid; observe the analytic layout report for the same document at
those widths reflects the same modes.