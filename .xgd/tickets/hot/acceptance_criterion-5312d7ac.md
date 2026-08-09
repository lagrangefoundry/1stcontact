---
uid: acceptance_criterion-5312d7ac
id: AC-903
type: acceptance_criterion
title: A published site URL serves whatever revision the site currently calls live,
  and follows it when that changes
created_by: xgd
created_at: '2026-08-06T18:48:21.095289+00:00'
updated_at: '2026-08-09T13:50:10.050962+00:00'
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

A request for a site's published address — which names the site only, never a
revision — returns the entry page of the revision that site currently records as
live, with a success status and an HTML content type. When the live revision
changes, the same unchanged URL returns the newer revision's content on its next
uncached request. Assets referenced by the published page resolve under the same
published address.

## Verification

Publish and deploy a revision, request the site's published URL and assert the
body matches that revision. Publish and deploy a second, different revision so
the live pointer moves, request the identical URL again and assert the response
body is the second revision's. Assert an asset referenced by the served page
resolves successfully under the same published address.