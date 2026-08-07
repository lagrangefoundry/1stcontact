---
uid: acceptance_criterion-e7bd3c3a
id: AC-904
type: acceptance_criterion
title: A directory-shaped URL missing its trailing slash permanently redirects to
  the slashed form, preserving the query
created_by: xgd
created_at: '2026-08-06T18:48:25.789845+00:00'
updated_at: '2026-08-07T22:18:19.591990+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A request for a snapshot's or a site's root without a trailing slash returns a
permanent redirect whose target is the identical path with a trailing slash
appended and the original query string carried across unchanged. This holds for
both the preview and the published addressing forms. Following the redirect
yields the entry page, and the asset references in that page resolve
successfully — which they would not have done had the bare form been served
directly, because each would have resolved one path level too high.

## Verification

Request the bare preview root and the bare published root; assert a permanent
redirect status and the exact target location, including a query string when one
was supplied. Follow the redirect, then resolve each asset reference in the
returned markup against the final URL and assert every one succeeds. Separately
assert that resolving the same references against the *bare* URL produces
addresses that do not resolve — pinning why the redirect exists.