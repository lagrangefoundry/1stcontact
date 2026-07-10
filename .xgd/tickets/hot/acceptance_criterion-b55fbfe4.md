---
uid: acceptance_criterion-b55fbfe4
id: AC-560
type: acceptance_criterion
title: A real module with injected content passes the security conformance dimension
  by rejecting it
created_by: xgd
created_at: '2026-07-10T00:34:02.724774+00:00'
updated_at: '2026-07-10T00:34:02.724774+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-38de5800
  kind: behavior
  regression_only: false
---

## Criterion
When a real catalog module (hero, text-block, services-grid, or contact-form) is
given schema-derived injection content and evaluated under the security conformance
dimension, it passes with **no security violation** — because the render path
rejects the dangerous value (a fail-loud safe rejection) rather than emitting it.
This is the end-to-end signal that the sink wiring closes the injection gap the
detector previously flagged on these same real modules.

## Verification
Run each named real module with generated injection content through the security
conformance dimension; assert the result reports no violation (the module rejected
the unsafe content rather than rendering it live).
