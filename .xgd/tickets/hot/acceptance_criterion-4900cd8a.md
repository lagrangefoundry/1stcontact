---
uid: acceptance_criterion-4900cd8a
id: AC-919
type: acceptance_criterion
title: An extensionless path with no page behind it still returns not-found
created_by: xgd
created_at: '2026-08-06T19:02:55.412840+00:00'
updated_at: '2026-08-09T13:50:14.241313+00:00'
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

The mapping resolves a URL to a page that exists; it never invents one. A
slug-only URL for which the site rendered no page returns not-found, in local
preview and on a deployed site alike, including for a slug nested under a real
directory.

## Verification

Request a slug-only path for which no page was rendered, at the site root and
beneath an existing directory, in both environments. Assert not-found in every
case.