---
uid: acceptance_criterion-a54bfee4
id: AC-979
type: acceptance_criterion
title: A request for a rendering channel or a component the workspace does not serve
  is answered as not found
created_by: xgd
created_at: '2026-08-07T01:45:16.569385+00:00'
updated_at: '2026-08-07T21:19:50.432143+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Asking the workspace origin for a rendering channel that is not one of the
site's channels, or for a component that is not one the workspace consumes, is
answered as not found. Such a request is never satisfied from a neighbouring
directory and never returns a success status with unrelated content.

## Verification

Request a preview path naming a channel that does not exist and assert a
not-found status. Request a component path naming a package the workspace does
not consume and assert a not-found status. Assert neither response body contains
content from a valid channel or component.