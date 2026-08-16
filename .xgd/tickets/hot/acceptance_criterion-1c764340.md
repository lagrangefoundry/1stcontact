---
uid: acceptance_criterion-1c764340
id: AC-1073
type: acceptance_criterion
title: Everything callable is declared and everything declared is callable; the set
  of operations that can change the site is closed and enumerated
created_by: xgd
created_at: '2026-08-10T09:06:03.586412+00:00'
updated_at: '2026-08-16T03:38:44.740490+00:00'
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

The operations the surface can actually perform and the operations it declares are
the same set — no operation exists that nothing documents, validates or audits,
and no operation is declared that cannot be performed. Every operation that can
change the site is classified as a write and belongs to a capability group that
somebody has to grant, so a new way to change a site cannot appear without being
declared, classified and granted.

## Verification

Compare the set of operation names the surface can perform against the set the
declaration names: assert they are equal. Then assert every operation classified
as a write appears in exactly one capability group, that group's declared effect
is "write", and that the enumerated write set matches the operations that change
the site — a new unlisted write would fail the comparison.