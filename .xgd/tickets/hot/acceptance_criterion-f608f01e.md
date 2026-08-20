---
uid: acceptance_criterion-f608f01e
id: AC-1250
type: acceptance_criterion
title: After every accepted edit the surface redraws from the census the store returned,
  and the selection lands where the edit left it
created_by: xgd
created_at: '2026-08-20T01:59:35.319017+00:00'
updated_at: '2026-08-20T02:20:57.610240+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

After any accepted edit the surface redraws from the census the store answered with, not from its
own guess at what changed, and the selection lands where the edit left it:

- an added entry appears immediately, with a count of zero, and is selectable and pickable;
- a removed entry disappears and nothing is left selected, so no detail describes an entry that is
  gone;
- a renamed entry appears under its new name, selected, carrying its count.

Each accepted edit is confirmed in words naming the entry and, where a count is meaningful, the
number of uses affected.

## Verification

On a site with a populated palette: add an entry and observe it listed at zero uses and immediately
selectable, with a confirmation naming it. Select an unreferenced entry and remove it; observe it
gone from the list, no entry selected, no detail panel, and a confirmation naming it. Rename a
referenced entry; observe the new name listed and selected, the old name absent, and a confirmation
naming the number of references rewritten. In each case observe the redrawn counts equal to what a
fresh read of the palette reports.