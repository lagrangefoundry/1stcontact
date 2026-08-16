---
uid: acceptance_criterion-becf310b
id: AC-1072
type: acceptance_criterion
title: The surface states its own version, distinct from the version of the format
  it is declared in
created_by: xgd
created_at: '2026-08-10T09:05:58.796867+00:00'
updated_at: '2026-08-16T03:38:43.283700+00:00'
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

The declaration carries two versions that do not mean the same thing: the version
of the declaration *format*, and the version of *this surface*. Both are readable
from the declaration, and the surface's own version is a positive whole number, so
a priming document, a customer-facing description or a third-party consumer can
state which surface it was written against.

## Verification

Read both versions from the shipped declaration. Assert the format version is the
format's own current value, and that the surface's own version is an integer
greater than zero and is read from the declaration rather than hard-coded beside
it.