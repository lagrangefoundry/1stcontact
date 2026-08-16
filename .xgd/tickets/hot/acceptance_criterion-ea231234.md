---
uid: acceptance_criterion-ea231234
id: AC-1081
type: acceptance_criterion
title: Where a place on a page is addressed from and how long that address lasts is
  stated once, and every operation taking an address takes the same kind
created_by: xgd
created_at: '2026-08-10T09:06:43.446334+00:00'
updated_at: '2026-08-16T03:39:05.907104+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The rule governing addresses — that they come from reading a page's map, and that
they last only as long as the map they were read from, because any change
regenerates them — is stated in the declaration in exactly two places that both
apply everywhere: the address parameter type, so every operation taking an address
inherits it, and the surface's overview, so the cross-cutting rule is said once.
No individual operation restates it, and no operation takes an address as an
untyped string.

## Verification

Assert the declared address parameter type's description states the re-read /
regeneration rule, and that the overview states it too. Then, for every declared
operation with an address parameter, assert the parameter is declared as the
address type rather than a bare string.