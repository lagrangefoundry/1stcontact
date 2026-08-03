---
uid: acceptance_criterion-788f9714
id: AC-744
type: acceptance_criterion
title: Surface fill, gradient and left accent are attributed to the painted boxes
  that geometrically contain a run, tightest first
created_by: xgd
created_at: '2026-08-03T00:24:50.737610+00:00'
updated_at: '2026-08-03T00:53:40.778281+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
The surface a text run sits on — its composited fill, a panel gradient, and a
painted left accent rule — is resolved from the painted boxes that geometrically
CONTAIN the run's box, considered smallest-area first, rather than from the
run's DOM ancestors.

Consequences that must hold:
- a surface painted by an absolutely-positioned box that is a sibling (not an
  ancestor) of the run is recorded as that run's surface;
- the page-level backstop behind such a box is not recorded in its place;
- on a conventionally nested page, where the painting box IS an ancestor, the
  recorded values are unchanged.

## Verification
Extract values from a page whose band and card are painted as
absolutely-positioned siblings of the text they sit behind: each run records the
card's fill (and, where authored, its gradient and left accent), not the page
background. Extract from a conventionally nested page with the same visual
result: the recorded surface values are identical to the sibling-painted case.