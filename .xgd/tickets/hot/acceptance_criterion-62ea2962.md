---
uid: acceptance_criterion-62ea2962
id: AC-2395
type: acceptance_criterion
title: Text nodes report per-glyph extents, and a <text> with <tspan> children reports
  each run's box and the parent's union
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:47.138161+00:00'
updated_at: '2026-11-08T07:26:22.155951+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
Every measured text node carries a per-glyph extent list, one entry per character, each with its position and size in root user space. For one `<text>` with id'd `<tspan>` children, each `<tspan>` reports its own box and the parent `<text>` reports a box that is the union of its runs. When the second and third `<tspan>` have no `x` authored, they still measure as placed after the run before them (each run's left is at or past the previous run's right), with no overlap.

## Verification
In a real browser, measure `<text id="t"><tspan id="a">1st</tspan><tspan id="b"> Con</tspan><tspan id="c">tact</tspan></text>`. Assert the glyph extents count matches the character count, a.right ≤ b.left ≤ c.left, and t's box spans a.left to c.right.