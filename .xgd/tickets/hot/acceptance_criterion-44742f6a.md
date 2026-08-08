---
uid: acceptance_criterion-44742f6a
id: AC-836
type: acceptance_criterion
title: Breakpoint blocks serialize in ascending width order and a hidden node is never
  re-shown by a track
created_by: xgd
created_at: '2026-08-06T02:37:34.997468+00:00'
updated_at: '2026-08-08T00:43:23.077535+00:00'
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
Two cascade-ordering guarantees, both of which the layout track makes load-bearing:

**Ascending breakpoint order.** The published stylesheet emits its breakpoint blocks in
**ascending width order**, regardless of the order in which the nodes that need them were
walked. Blocks were previously ordered by first appearance across the document, so a node
introducing 768 before another introduced 520 placed 520 *after* 768 in the stylesheet —
and for any node declaring both, the 520 rule then won at desktop widths. That is silent
while every node keyframes at the same captured ladder and a live defect the moment two
authored breakpoints interleave, which is exactly what a layout track invites. A
condition carrying no minimum width (a maximum-width or a reduced-motion block) sorts
last, since it is disjoint from the width blocks or must survive them.

**Visibility is the final word on display.** Within any one breakpoint block, a node's
visibility rule is emitted **last**, so a node hidden at a width stays hidden even when
its layout track re-states a display mode at that same width. Two features now write the
same property for the same node; hidden wins.

## Verification
Publish a page whose first container introduces a 768px breakpoint and whose second
declares both 520 and 768. Observe the stylesheet's breakpoint blocks appear in ascending
order, and that the second container's widest rule is the one in force at desktop width.
Publish a container that both declares a `stack@0 → row@768` track and is hidden from
768px upward, and observe that the last declaration for that node inside the 768px block
hides it.