---
uid: acceptance_criterion-1c764340
id: AC-1073
type: acceptance_criterion
title: Everything callable is declared and everything declared is callable, measured
  over the composition of the portable core and the host's own operations
created_by: xgd
created_at: '2026-08-10T09:06:03.586412+00:00'
updated_at: '2026-08-31T10:40:10.724825+00:00'
completed_at: null
last_field_updated: title
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
and no operation is declared that cannot be performed.

What "can actually perform" means is the **composition** of the portable half, which
names no filesystem and runs anywhere, and the operations the running host itself
supplies because they need the operator's own disk. The declaration does not vary
by host. So the comparison is against the union: measuring it against the portable
half alone would report a declared operation as unimplemented, which is the
opposite of what this criterion is about, and the union is what any host actually
offers.

Every operation that can change the site is classified as a write and belongs to a
capability group that somebody has to grant, so a new way to change a site cannot
appear without being declared, classified and granted.

## Verification

Compose the operation names the portable half supplies with those the host supplies
and compare that set against the set the declaration names: assert they are equal.
Assert the two halves are disjoint, so an operation cannot be counted twice or
silently reimplemented on both sides. Assert that the operation needing the
operator's own disk is present in the host's half and absent from the portable one,
so a host without a disk offers a strictly smaller set rather than a broken one.
Then assert every operation classified as a write appears in exactly one capability
group, that group's declared effect is "write", and that the enumerated write set
matches the operations that change the site — a new unlisted write would fail the
comparison.
