---
uid: acceptance_criterion-50b8bd81
id: AC-797
type: acceptance_criterion
title: A bundle whose layout seams and behaviour bindings disagree fails the import,
  naming the mismatch
created_by: xgd
created_at: '2026-08-03T03:47:03.459623+00:00'
updated_at: '2026-08-03T04:01:07.941137+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8b2f295c
  kind: behavior
  regression_only: false
---

## Criterion
The layout and the behaviour bindings of a bundle are produced together at
capture time and must describe the same seams. When they do not — a seam in the
layout that no binding claims, or a binding naming a seam the layout does not
carry — the import fails, naming each mismatch in whichever direction it occurs
and pointing at re-capturing the bundle as the remedy, rather than importing
behaviours that would render as inert placeholders. A bundle that carries
neither seams nor bindings (a page with no behaviour, or one captured before
behaviours were recovered) imports normally.

## Verification
Import a bundle whose layout carries a seam but that has no behaviour bindings:
confirm the failure names the unclaimed seam and the re-capture remedy. Add a
binding for a seam the layout does not carry and confirm the failure names that
binding as absent from the layout. Import a bundle with no seams and no bindings
and confirm it succeeds.