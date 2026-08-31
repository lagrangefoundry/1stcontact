---
uid: acceptance_criterion-e7bd3c3a
id: AC-904
type: acceptance_criterion
title: A published root missing its trailing slash permanently redirects to the slashed
  form, preserving the query
created_by: xgd
created_at: '2026-08-06T18:48:25.789845+00:00'
updated_at: '2026-08-31T11:52:54.792857+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A request for a site's published root without a trailing slash returns a
permanent redirect whose target is the identical path with a trailing slash
appended and the original query string carried across unchanged. Following the
redirect yields the entry page, and the asset references in that page resolve
successfully — which they would not have done had the bare form been served
directly, because each would have resolved one path level too high.

## Verification

Request the bare published root; assert a permanent redirect status and the
exact target location, and repeat with a query string supplied, asserting it
survives. Follow the redirect, then resolve each asset reference in the returned
markup against the final URL and assert every one succeeds. Separately resolve
the same references against the *bare* URL and assert the addresses they produce
do not serve those assets — pinning why the redirect exists.
