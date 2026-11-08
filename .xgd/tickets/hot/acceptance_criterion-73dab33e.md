---
uid: acceptance_criterion-73dab33e
id: AC-2398
type: acceptance_criterion
title: Nodes without an id appear under a path reference; defs are skipped; degenerate
  nodes are flagged; a node whose box cannot be read is named in warnings
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:49.320235+00:00'
updated_at: '2026-11-08T10:12:40.764780+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
Every node whose box can be read appears in `nodes`, whether or not it has an `id` (up to the node cap, see AC-2411). A node with an `id` is referenced as `#<id>`; a node without one is referenced by a path through the tree. Elements inside `<defs>`, gradients, clip paths, masks, `<title>` and `<desc>` do not appear. A node that is present but paints nothing (e.g. an empty `<text>`) appears with `degenerate: true`. It is never left out.

A node whose box cannot be read at all (its `getBBox()` fails) is the one exception. It is left out of `nodes` and named in `warnings` as `<ref> has no measurable box.` (`#<id>`, or its path when it has none). It is still never silently missing. Its readable descendants are still reported. (Narrowed at reconciliation; see the story's Reconciliation Decisions.)

## Verification
In a real browser (skipped, with the reason, where no Chromium can launch), measure a drawing with an un-id'd `<rect>`, a `<linearGradient>` in `<defs>`, and an empty `<text id="e">`. Assert the rect appears under a path reference, nothing from `<defs>` appears, and `#e` is present and flagged degenerate.

Without a browser, run the shipped `measureScript` through the production `browserMeasurer` and `measure_drawing` against a scripted page where `getBBox()` fails for `<g id="ghost">` and for an un-id'd `<path>`. Assert neither is in `nodes`, `warnings` holds `#ghost has no measurable box.` and `0.2 has no measurable box.`, the rect inside `#ghost` is still reported, and an empty `<text>` is present, flagged degenerate, and not warned about.
