---
uid: acceptance_criterion-ccefcbab
id: AC-704
type: acceptance_criterion
title: Survivor capabilities declare the full five-dimension conformance obligation
  set
created_by: xgd
created_at: '2026-07-22T19:55:07.909196+00:00'
updated_at: '2026-07-23T06:57:13.336850+00:00'
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
Each survivor capability (carousel, contact-form) is subject to the full set of
conformance obligations: safety, security, cross-browser, responsive, and
isolation. The capability's published contract enumerates exactly these five
dimensions, so the conformance harness holds every capability to the complete
envelope rather than a subset.

## Verification
Introspect each survivor capability's contract and assert its declared
conformance obligations are exactly {safety, security, cross-browser, responsive,
isolation}. Confirm the harness would exercise all five for each capability.