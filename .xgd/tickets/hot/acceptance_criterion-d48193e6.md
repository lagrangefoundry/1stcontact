---
uid: acceptance_criterion-d48193e6
id: AC-922
type: acceptance_criterion
title: 'In local preview the mapping cannot widen reach: traversal is still rejected
  and never exposes a page outside the served site'
created_by: xgd
created_at: '2026-08-06T19:03:24.047227+00:00'
updated_at: '2026-08-09T13:50:15.109256+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-66115f6b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The mapping is applied only after a request has been confined to the site being
served, so it cannot be used as a lever to reach outside it. A traversing
request — with or without an extension, and from any depth — is refused or
returns not-found, and never returns the contents of a page file lying outside
the served site's directory.

## Verification

Place a page file outside the served site's directory. Issue traversing requests
in both extensionless and explicit forms, including from a nested path. Assert
each is refused or not-found and that no response body contains that file's
content.