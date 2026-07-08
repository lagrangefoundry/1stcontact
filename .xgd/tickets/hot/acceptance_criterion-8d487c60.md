---
uid: acceptance_criterion-8d487c60
id: AC-437
type: acceptance_criterion
title: Resolving an unknown module fails with a clear catalog-miss error
created_by: xgd
created_at: '2026-07-08T19:20:24.351253+00:00'
updated_at: '2026-07-08T19:20:24.351253+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
Requesting a module from the catalog by an id/version that is not present (unknown id, or a known id at an unavailable version) fails with an explicit catalog-miss error rather than returning nothing or a wrong module. The error message names what was requested and lists the modules the catalog does contain.

## Verification
Attempt to resolve a non-existent module (e.g. an unknown id at version 1) and assert the operation raises an error whose message identifies the requested id/version and enumerates the known catalog entries.
