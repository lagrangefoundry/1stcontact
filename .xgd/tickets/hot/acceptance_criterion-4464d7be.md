---
uid: acceptance_criterion-4464d7be
id: AC-920
type: acceptance_criterion
title: A response produced by the mapping is typed from the page that answered, not
  from the requested path
created_by: xgd
created_at: '2026-08-06T19:03:00.056754+00:00'
updated_at: '2026-09-10T16:05:58.352603+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-66115f6b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

When a request succeeds via the mapping, its declared content type is HTML —
derived from the page that actually answered — rather than guessed from a
requested path that carries no extension to guess from. This holds for full and
header-only requests on the deployed site and in local preview.

## Verification

Request a slug-only page URL in local preview and on the deployed site's
published addressing form, full and header-only, and assert the declared content
type is HTML in every case. Confirm the assertion discriminates by checking a
non-HTML asset served by exact match still declares its own type.
