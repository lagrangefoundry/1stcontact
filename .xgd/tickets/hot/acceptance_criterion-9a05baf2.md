---
uid: acceptance_criterion-9a05baf2
id: AC-703
type: acceptance_criterion
title: 'Isolation conformance: degenerate input degrades inertly; a throwing core
  is flagged'
created_by: xgd
created_at: '2026-07-22T19:55:05.237152+00:00'
updated_at: '2026-07-23T06:57:12.608181+00:00'
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
A capability given schema-valid but **degenerate** config/slots (wrong-typed
config values, an empty or null slot) must degrade inertly: it renders without
throwing and still emits a structurally-intact page band. The isolation
conformance check passes for such input on both survivor capabilities. Conversely,
a capability whose core throws during render — or collapses to an empty page band —
is reported as an isolation violation, so the dimension is a genuine
discriminator, not a no-op. The check runs at render level with no browser.

## Verification
Run the isolation conformance check on the carousel and contact-form with
degenerate-but-schema-valid fixtures (wrong-typed config, missing/empty slots)
and assert it passes (no throw, page band present). Run it against a capability
whose core throws during render and assert an isolation violation is reported
identifying the render failure.