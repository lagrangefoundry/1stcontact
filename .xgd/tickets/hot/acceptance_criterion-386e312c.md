---
uid: acceptance_criterion-386e312c
id: AC-652
type: acceptance_criterion
title: --classify labels changed nodes and groups structural moves first
created_by: xgd
created_at: '2026-07-19T02:51:28.378017+00:00'
updated_at: '2026-07-19T02:51:28.378017+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-2c7069fe
  kind: behavior
  regression_only: false
---

## Criterion
With `--classify`, each changed node is labelled with exactly one reproduction move — presence-flip, layout-swap, or value-step — and only changed nodes are reported. A node that appears or departs across sizes is labelled presence-flip; among nodes present at every size, one whose arrangement flips (e.g. row↔stack) is labelled layout-swap; any other cross-size difference is a value-step. Output groups the structural moves (presence-flip, then layout-swap) before value-step. A site with no cross-size change instead reports a single confirmation that every node holds steady.

## Verification
Run `responsive-diff --classify` against a fixture containing a departing node, an arrangement flip, and a font-size step. Assert the three nodes are labelled presence-flip, layout-swap, and value-step respectively, and that presence-flip/layout-swap groups precede the value-step group. Run again on a fixture with no cross-size change and assert the single "holds steady" confirmation with no per-node rows.
