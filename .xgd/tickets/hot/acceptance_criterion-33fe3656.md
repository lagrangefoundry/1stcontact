---
uid: acceptance_criterion-33fe3656
id: AC-882
type: acceptance_criterion
title: A node declaring the accent but carrying no texture emits nothing — no accent,
  no pointer handle and no pointer script — because the axis accents a texture and
  silence is the honest presentation when there is none
created_by: xgd
created_at: '2026-08-06T18:09:25.459181+00:00'
updated_at: '2026-08-08T00:43:44.815768+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d2b5cb1c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A node that declares a pointer accent but paints no texture presents nothing new:
no region of colour follows the cursor over it, the node carries no handle for the
pointer driver, and a page all of whose accent declarations are on textureless
nodes ships no pointer driver at all. The published page for such a document is
the page it would have been without the declaration.

The axis accents *a texture*. With no texture to redraw, a bloom of flat colour
tracking the mouse would be a different effect rather than a degraded one, so the
honest presentation is silence.

## Verification
Render a page whose only accent declaration sits on a node with no texture.
Assert the published output contains no accent presentation for that node, that
the node carries no pointer handle, and that no pointer driver is present in the
output. Drive a pointer over the node and assert nothing changes. Assert the same
output is byte-identical to the page rendered with the accent declaration
removed.