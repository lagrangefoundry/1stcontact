---
uid: acceptance_criterion-fd1af685
id: AC-909
type: acceptance_criterion
title: Snapshot-addressed responses are cacheable as immutable; published responses
  carry a short lifetime
created_by: xgd
created_at: '2026-08-06T18:49:31.162888+00:00'
updated_at: '2026-08-07T22:18:25.526774+00:00'
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

A response served from a snapshot-addressed URL declares itself publicly
cacheable for a long lifetime and immutable, because those bytes are named by
their own content and can never change. A response served from a published site
URL declares itself publicly cacheable for a short lifetime only, because the
address is not revision-scoped and its meaning changes when a new revision goes
live. Both channels state a freshness policy on every successful response.

## Verification

Request an entry page and an asset on a preview URL and assert the long-lifetime
immutable freshness directive; request the equivalents on the published URL and
assert the short lifetime and the absence of the immutable directive. Assert
both are declared publicly cacheable.