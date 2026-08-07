---
uid: acceptance_criterion-8d669459
id: AC-923
type: acceptance_criterion
title: On the deployed site, a URL the address grammar rejects is still rejected and
  never reaches the mapping
created_by: xgd
created_at: '2026-08-06T19:03:28.701738+00:00'
updated_at: '2026-08-07T22:18:41.588753+00:00'
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

Existing address validation on the deployed site is unchanged by the mapping: an
invalid site name, and any URL component that is empty, dot-shaped,
separator-bearing or malformed, still returns not-found. Such a URL is rejected
outright — it is never treated as an extensionless page candidate, so no page
markup can be served in response to it.

## Verification

Request deployed-site URLs containing traversal components, malformed
percent-encoding, and an invalid site name, each shaped so the last segment
carries no extension and would otherwise be eligible. Assert each returns
not-found and returns no page markup, and that the same URLs are not offered a
page candidate at all.