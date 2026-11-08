---
uid: acceptance_criterion-73dab33e
id: AC-2398
type: acceptance_criterion
title: Nodes without an id appear under a path reference; defs are skipped; degenerate
  nodes are flagged
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:49.320235+00:00'
updated_at: '2026-11-08T07:26:21.511992+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
Every measurable node in the drawing appears in `nodes`, whether or not it has an `id`. A node with an `id` is referenced as `#<id>`; a node without one is referenced by a path through the tree. Elements inside `<defs>`, gradients and clip paths do not appear. A node with no measurable geometry (e.g. an empty `<text>`) appears with a flag marking it degenerate, so it is never simply missing.

## Verification
In a real browser, measure a drawing with an un-id'd `<rect>`, a `<linearGradient>` in `<defs>`, and an empty `<text id="e">`. Assert the rect appears under a path reference, nothing from `<defs>` appears, and `#e` is present and flagged degenerate.