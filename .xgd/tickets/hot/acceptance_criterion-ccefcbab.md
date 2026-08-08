---
uid: acceptance_criterion-ccefcbab
id: AC-704
type: acceptance_criterion
title: Survivor behavior modules declare the full five-dimension conformance obligation
  set
created_by: xgd
created_at: '2026-07-22T19:55:07.909196+00:00'
updated_at: '2026-08-08T00:42:10.404294+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Each survivor behavior module (carousel, contact-form) is subject to the full set
of conformance obligations: safety, security, cross-browser, responsive, and
isolation. The behavior's published contract enumerates exactly these five
dimensions, so the conformance harness holds every behavior module to the
complete envelope rather than a subset.

## Verification
Introspect each survivor behavior module's contract and assert its declared
conformance obligations are exactly {safety, security, cross-browser, responsive,
isolation}. Confirm the harness would exercise all five for each behavior module.